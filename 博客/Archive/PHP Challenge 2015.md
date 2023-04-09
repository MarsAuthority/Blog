---
title: PHP Challenge 2015
tags:
  - 博客
  - PHP
  - web安全
---

## 背景

在乌云上看到[PHP Challenge 2015](http://zone.wooyun.org/content/22100)，深感兴趣，但并无思路，直到看了[@Ryat](https://weibo.com/3202054374/CtNpv1ov8?type=comment)大牛的微博才知道答案。

## PHP bug

先贴出代码吧

```php
<?php

/*******************************************************************
* PHP Challenge 2015
*******************************************************************
* Why leave all the fun to the XSS crowd?
*
* Do you know PHP?
* And are you up to date with all its latest peculiarities?
*
* Are you sure?
*
* If you believe you do then solve this challenge and create an
* input that will make the following code believe you are the ADMIN.
* Becoming any other user is not good enough, but a first step.
*
* Attention this code is installed on a Mac OS X 10.9 system
* that is running PHP 5.4.30 !!!
*
* TIPS: OS X is mentioned because OS X never runs latest PHP
*       Challenge will not work with latest PHP
*       Also challenge will only work on 64bit systems
*       To solve challenge you need to combine what a normal
*       attacker would do when he sees this code with knowledge
*       about latest known PHP quirks
*       And you cannot bruteforce the admin password directly.
*       To give you an idea - first half is:
*          orewgfpeowöfgphewoöfeiuwgöpuerhjwfiuvuger
*
* If you know the answer please submit it to info@sektioneins.de
********************************************************************/

$users = array(
        "0:9b5c3d2b64b8f74e56edec71462bd97a" ,
        "1:4eb5fb1501102508a86971773849d266",
        "2:facabd94d57fc9f1e655ef9ce891e86e",
        "3:ce3924f011fe323df3a6a95222b0c909",
        "4:7f6618422e6a7ca2e939bd83abde402c",
        "5:06e2b745f3124f7d670f78eabaa94809",
        "6:8e39a6e40900bb0824a8e150c0d0d59f",
        "7:d035e1a80bbb377ce1edce42728849f2",
        "8:0927d64a71a9d0078c274fc5f4f10821",
        "9:e2e23d64a642ee82c7a270c6c76df142",
        "10:70298593dd7ada576aff61b6750b9118"
);

$valid_user = false;

$input = $_COOKIE['user'];

$input[1] = md5($input[1]);

foreach ($users as $user)
{
        $user = explode(":", $user);
        echo 'user = '.$user;
        if ($input === $user) {
                $uid = $input[0] + 0;
                $valid_user = true;
        }
}

if (!$valid_user) {
        die("not a valid user\n");
}

if ($uid == 0) {

        echo "Hello Admin How can I serve you today?\n";
        echo "SECRETS ....\n";

} else {
        echo "Welcome back user\n";
}

?>
```

按照Ryat的提示，找到([https://bugs.php.net/bug.php?id=69892](https://bugs.php.net/bug.php?id=69892))

```php
Bug #69892 	Different arrays compare indentical due to integer key truncation
Description:
------------
var_dump([0 => 0] === [0x100000000 => 0]); // bool(true)
on all versions: http://3v4l.org/Sjdf8
```

integer类型的key截断导致不同的数组比较结果相同。我们去看看PHP源码中的相关片段，在`Zend/zend_hash.c`：

```c
//php5.2.14
ZEND_API int zend_hash_compare(HashTable *ht1, HashTable *ht2, compare_func_t compar, zend_bool ordered TSRMLS_DC)
{
	Bucket *p1, *p2 = NULL;
	int result;
	void *pData2;

	IS_CONSISTENT(ht1);
	IS_CONSISTENT(ht2);

	HASH_PROTECT_RECURSION(ht1); 
	HASH_PROTECT_RECURSION(ht2); 

	result = ht1->nNumOfElements - ht2->nNumOfElements;
	if (result!=0) {
		HASH_UNPROTECT_RECURSION(ht1); 
		HASH_UNPROTECT_RECURSION(ht2); 
		return result;
	}

	p1 = ht1->pListHead;
	if (ordered) {
		p2 = ht2->pListHead;
	}

	while (p1) {
		if (ordered && !p2) {
			HASH_UNPROTECT_RECURSION(ht1); 
			HASH_UNPROTECT_RECURSION(ht2); 
			return 1; /* That's not supposed to happen */
		}
		if (ordered) {
			if (p1->nKeyLength==0 && p2->nKeyLength==0) { /* numeric indices */
				result = p1->h - p2->h;
				if (result!=0) {
					HASH_UNPROTECT_RECURSION(ht1); 
					HASH_UNPROTECT_RECURSION(ht2); 
					return result;
				}
			} else { /* string indices */
				result = p1->nKeyLength - p2->nKeyLength;
				if (result!=0) {
					HASH_UNPROTECT_RECURSION(ht1); 
					HASH_UNPROTECT_RECURSION(ht2); 
					return result;
				}
				result = memcmp(p1->arKey, p2->arKey, p1->nKeyLength);
				if (result!=0) {
					HASH_UNPROTECT_RECURSION(ht1); 
					HASH_UNPROTECT_RECURSION(ht2); 
					return result;
				}
			}
			pData2 = p2->pData;
		} else {
			if (p1->nKeyLength==0) { /* numeric index */
				if (zend_hash_index_find(ht2, p1->h, &pData2)==FAILURE) {
					HASH_UNPROTECT_RECURSION(ht1); 
					HASH_UNPROTECT_RECURSION(ht2); 
					return 1;
				}
			} else { /* string index */
				if (zend_hash_quick_find(ht2, p1->arKey, p1->nKeyLength, p1->h, &pData2)==FAILURE) {
					HASH_UNPROTECT_RECURSION(ht1); 
					HASH_UNPROTECT_RECURSION(ht2); 
					return 1;
				}
			}
		}
		result = compar(p1->pData, pData2 TSRMLS_CC);
		if (result!=0) {
			HASH_UNPROTECT_RECURSION(ht1); 
			HASH_UNPROTECT_RECURSION(ht2); 
			return result;
		}
		p1 = p1->pListNext;
		if (ordered) {
			p2 = p2->pListNext;
		}
	}
	
	HASH_UNPROTECT_RECURSION(ht1); 
	HASH_UNPROTECT_RECURSION(ht2); 
	return 0;
}
```

关键在34行:

```c
if (p1->nKeyLength==0 && p2->nKeyLength==0) { /* numeric indices */
    result = p1->h - p2->h; //这里喔
    if (result!=0) {
        HASH_UNPROTECT_RECURSION(ht1); 
        HASH_UNPROTECT_RECURSION(ht2); 
        return result;
    }
```

当数组的key为integer进到这里，比较他们的key是否相同，p1和p2是PHP的bucket结构体，其中h保存着数组的key。bucket结构如下：

```c
//location:Zend/zend_hash.h
typedef struct bucket {
	ulong h;						/* Used for numeric indexing */
	uint nKeyLength;
	void *pData;
	void *pDataPtr;
	struct bucket *pListNext;
	struct bucket *pListLast;
	struct bucket *pNext;
	struct bucket *pLast;
	char arKey[1]; /* Must be last element */
} Bucket;
```

可以看出h是ulong，ulong是一个unsigned long，如下：

```c
typedef unsigned long ulong;
```

看到这里不知道大家有没有看出问题？注意喔，保存p1和p2差值的变量是result，而result是int型变量，这就导致了在64位系统中，unsigned long是64位整型，而int是32位整型，类型的不同出现问题。程序会将`p1->h - p2->h`的结果强制转换为int，我们都知道unsigned long转int会截取低4个字节。所以只需要让unsigned long的低4字节为0，它转换后的int就为0。比如我们将二进制`10000000000000000000000000000000000000`转换为十进制`137438953472`，那么`137438953472`转为int就为0。

## 分析

现在再来看看这个php代码吧，前面的那个bug利用前提是数组的value相同，key不同，所以首先需要匹配一个md5出来，我在cmd5试了这10个md5，只有第五个`06e2b745f3124f7d670f78eabaa94809`能解出，原文是`hund`。于是首先写入cookie：`Cookie: user[0]=5;user[1]=hund;` 程序会进入58行，验证通过，$valid_user被改为true，这个时候输出为`Welcome back user`。到了这一步答案已经很接近了，只需要将$uid改为0即可。现在试试前面提到的漏洞，我们写入cookie：`Cookie: user[137438953472]=5;user[1]=hund;` 这个时候因为之前提到的漏洞，程序还是会进入58行，因为$input[0]未赋值，所以为NULL，在PHP中`0+NULL=0`,故成功将$uid改为0。
