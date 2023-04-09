---
title: 读懂PHP opcode及其在webshell检测中的应用
tags:
  - 博客
  - PHP
  - webshell
---

## 什么是opcode

当Zend Engine解析PHP脚本的时候，会对脚本进行词法、语法分析，然后编译成opcode来执行，类似JVM中的字节码(byte codes)，只不过opcode不会像class文件那种存在磁盘，而是在内存中直到PHP的生命周期结束。

盗一张图：

![opcode](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/DlYw5G.jpg)

> opcode在PHP内核中是如何生成的可以参考 : [http://www.php-internals.com/book/?p=chapt02/02-03-02-opcode](http://www.php-internals.com/book/?p=chapt02/02-03-02-opcode)
> 

我们可以通过PHP扩展vld来查看PHP脚本的opcode，可以参考：([http://blog.csdn.net/21aspnet/article/details/7002644)](http://blog.csdn.net/21aspnet/article/details/7002644))

Zend Engine中编译和执行PHP脚本的关键函数是：

```c
ZEND_API zend_op_array *(*zend_compile_file)(zend_file_handle *file_handle, int type TSRMLS_DC);
ZEND_API void (*zend_execute)(zend_op_array *op_array TSRMLS_DC);
```

VLD就是通过HOOK Zend Engine中的这两个函数来实现dump opcode，来看看它的代码：

```c
PHP_RINIT_FUNCTION(vld){
    old_compile_file = zend_compile_file;
#if (PHP_MAJOR_VERSION > 5) || (PHP_MAJOR_VERSION == 5 && PHP_MINOR_VERSION >= 2)
    old_compile_string = zend_compile_string;
#endif
    old_execute = zend_execute;
    if (VLD_G(active)) {
        zend_compile_file = vld_compile_file;
#if (PHP_MAJOR_VERSION > 5) || (PHP_MAJOR_VERSION == 5 && PHP_MINOR_VERSION >= 2)
        zend_compile_string = vld_compile_string;
#endif
        if (!VLD_G(execute)) {
            zend_execute = vld_execute;
        }
    }
}
```

在vld_compile_file中完成HOOK:

```c
static zend_op_array *vld_compile_file(zend_file_handle *file_handle, int type TSRMLS_DC){
    ...
    op_array = old_compile_file (file_handle, type TSRMLS_CC);
    ...
    return op_array;
}
```

获取opcode后将其格式化输出：

```c
op_array = old_compile_file (file_handle, type TSRMLS_CC);
if (op_array) {
    vld_dump_oparray (op_array TSRMLS_CC); //格式化输出函数
}
```

其实APC、Opcache等opcode优化扩展都是用这种方式来实现的。

## 读懂opcode

下面我们用vld生成一段opcode看看。PHP脚本如下：

```php
<?php
function hello($who) {
    return sprintf("Hello, %s!", $who);
}

echo hello('World');
```

执行vld，输出：

```php
$ ~php -dextension=vld.so -dvld.active=1 -dvld.verbosity=0 -dvld.execute=0 function.php
filename:       function.php
function name:  (null)
number of ops:  5
compiled vars:  none
line     # *  op                           fetch          ext  return  operands
---------------------------------------------------------------------------------
   2     0  >   NOP                                                      
   6     1      SEND_VAL                                                 'World'
         2      DO_FCALL                                      1  $0      'hello'
         3      ECHO                                                     $0
   7     4    > RETURN                                                   1

branch: #  0; line:     2-    7; sop:     0; eop:     4
path #1: 0, 
Function hello:
filename:      function.php
function name:  hello
number of ops:  6
compiled vars:  !0 = $who
line     # *  op                           fetch          ext  return  operands
---------------------------------------------------------------------------------
   2     0  >   RECV                                                     1
   3     1      SEND_VAL                                                 'Hello%2C+%25s%21'
         2      SEND_VAR                                                 !0
         3      DO_FCALL                                      2  $0      'sprintf'
         4    > RETURN                                                   $0
   4     5*   > RETURN                                                   null

branch: #  0; line:     2-    4; sop:     0; eop:     5
path #1: 0, 
End of function hello.
```

怎么去看呢？前面比较清晰，filename，function name 都是顾名思义。后面两行：

1. number of ops：opcode的数量
2. compiled vars：PHP变量编译后的opcode表示形式，因为opcode不会使用变量的名字，而是使用变量的ID。比如后面的hello函数中，$who 对应着 !0

接着是后面的表格，列名含义如下表：

| 列名 | 含义 |
| --- | --- |
| line | 对应PHP脚本中的行数 |
| # | opcode编号 |
| * | 貌似没用 |
| op | 使用的Opcode，见：https://php.net/manual/en/internals2.opcodes.php#internals2.opcodes |
| fetch | 不清楚 |
| ext | 脚本执行所需要的其他信息 |
| return | 返回值 |
| operands | 操作数 |

其实这些列名对应着PHP内核中opcode结构体的成员变量：

```c
struct _zend_op {
    opcode_handler_t handler;
    znode_op op1;  // op1和op2是operands
    znode_op op2;
    znode_op result; //return
    ulong extended_value; //ext
    uint lineno; //line
    zend_uchar opcode; //opcode
    zend_uchar op1_type;
    zend_uchar op2_type;
    zend_uchar result_type;
};
```

那么这段opcode的意思是：

1. NOP是编译过程优化的结果，没什么意义。
2. 把’World’作为参数传给后面的函数。
3. 调用函数hello, 返回值为$0。
4. ECHO 输出$0。
5. 函数结束返回。

下一段是hello函数：

1. 接受传给函数的参数。
2. 把’Hello%2C+%25s%21’作为参数传给后面的函数。
3. 把!0作为参数传给后面的函数。
4. 调用函数sprintf，返回值为$0。
5. 函数返回$0。
6. 函数结束。

## 总结

在Webshell检测中，opcode可以：（这里只讨论opcode在webshell检测中的作用）

1. 辅助检测PHP后门/Webshell。
    1. 优点：作为静态分析的辅助手段，可以快速精确定位PHP脚本中可控函数及参数的调用。
    2. 缺点：需要人工维护关键字，无法应对变形马，如编码、ASCII运算等等。
2. 帮助我们更加深入地理解PHP内核机制，使我们可以修改PHP源码或者以扩展的形式来动态检测PHP后门/Webshell。（HOOK关键危险函数，如eval, assert等，当GPC参数进入危险函数及有相关危险操作时，判定为后门/Webshell）
    1. 优点：上面写的缺点取反，并且误报率低，准确。
    2. 缺点：部署，维护成本高。

## Reference

1. [http://www.laruence.com/2008/08/14/250.html](http://www.laruence.com/2008/08/14/250.html)
2. [http://blog.pascal-martin.fr/post/php-obtenir-dump-opcodes.html](http://blog.pascal-martin.fr/post/php-obtenir-dump-opcodes.html)
3. [http://rancoud.com/read-phps-opcode/](http://rancoud.com/read-phps-opcode/)
4. [http://www.php-internals.com/book/?p=chapt02/02-03-02-opcode](http://www.php-internals.com/book/?p=chapt02/02-03-02-opcode)
5. [http://security.tencent.com/index.php/blog/msg/19](http://security.tencent.com/index.php/blog/msg/19)

⌥E