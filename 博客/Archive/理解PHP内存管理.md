---
title: 理解PHP内存管理
tags:
  - 博客
  - PHP
  - 内存管理
---

# 内存管理概述

内存管理，是指软件运行时对计算机内存资源的分配和使用的技术。其最主要的目的是如何高效，快速的分配，并且在适当的时候释放和回收内存资源。

在使用C/C++开发程序的时候，需要格外注意内存管理，申请了内存再使用完后要记得释放，否则可能会造成内存泄漏。如果程序需要常驻内存，那么内存泄漏问题会把机器的内存耗光。所以在PHP这种需要常驻内存的程序来说，内存管理非常重要，它决定了程序的稳定性和执行效率。另外，应用程序向系统申请内存，释放内存的时候会引发系统调用，系统调用提供用户程序与操作系统之间的接口，他会触发0x80 号中断（int 0x80）将CPU从用户态切换到内核态，执行完毕再切换回用户态。在PHP这种对性能要求较高的程序来说，频繁在用户态和内核态切换会带来很大的性能消耗。

介于以上原因，PHP实现了自己的内存管理器（ZendMM）, 所以在编写PHP脚本的时候我们不需要对内存进行管理。

# ZendMM

```
Zend Memory Manager
===================

General:
--------

The goal of the new memory manager (available since PHP 5.2) is to reduce memory
allocation overhead and speedup memory management.
```

PHP的内存管理是分层的，它分为三层：存储层（storage）、堆层（heap）和接口层（emalloc/efree）。存储层通过 malloc()、mmap() 等函数向系统真正的申请内存，并通过 free() 函数释放所申请的内存。存储层通常一次申请大量内存，这样接口层在需要分配空间的时候，通过堆层将存储层申请到的内存进行拆分，按照大小给接口层使用。在存储层共有4种内存分配方案: malloc，win32，mmap_anon，mmap_zero。默认使用malloc分配内存，如果设置了ZEND_WIN32宏，则为windows版本，调用HeapAlloc分配内存。并且PHP的内存方案可以通过设置变量来修改。

```
the Zend MM can be tweaked using ZEND_MM_MEM_TYPE and ZEND_MM_SEG_SIZE environment
variables.  Default values are "malloc" and "256K". Dependent on target system you
can also use "mmap_anon", "mmap_zero" and "win32" storage managers.

  $ ZEND_MM_MEM_TYPE=mmap_anon ZEND_MM_SEG_SIZE=1M sapi/cli/php ..etc.
```

借用一张图来说明一下：

![4PFj1W](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/4PFj1W.jpg)

内存分配有两种类型：

1. small, 为了速度和效率。
2. large, 为了不造成浪费。

内存分配有两种生命周期：

1. request，最常见的情况，只需要满足当前请求的内存需求，一次请求结束之后就free。
2. persistent，需要被分配比单个请求持续时间更长的一段时间的内存，这种情况下使用操作系统的malloc来分配内存，这些分配的内存并不会添加ZendMM使用的那些额外的信息，从而实现永久分配。

ZendMM提供的request内存分配相关函数：

```
void*  emalloc(size_t size);
void*  erealloc(void* pointer, size_t size);
void*  ecalloc(size_t num, size_t count);
void   efree(void* pointer);
```

ZendMM提供的persistent内存分配相关函数：

```
void* pemalloc(size_t size, zend_bool persistent);
void* perealloc(void* pointer, size_t size, zend_bool persistent);
void* pecalloc(size_t num, size_t count, zend_bool persistent);
void  pefree(void* pointer, zend_bool persistent);
```

# 存储层（storage）

存储层（storage）是向系统真正的申请内存，它的作用是将内存分配的方式对堆层透明化。我们先看看它的结构。

```
/* Heaps with user defined storage */
typedef struct _zend_mm_storage zend_mm_storage;

typedef struct _zend_mm_segment {
  size_t  size;
  struct _zend_mm_segment *next_segment;
} zend_mm_segment;

typedef struct _zend_mm_mem_handlers {
  const char *name;
  zend_mm_storage* (*init)(void *params);
  void (*dtor)(zend_mm_storage *storage);
  void (*compact)(zend_mm_storage *storage);
  zend_mm_segment* (*_alloc)(zend_mm_storage *storage, size_t size);
  zend_mm_segment* (*_realloc)(zend_mm_storage *storage, zend_mm_segment *ptr, size_t size);
  void (*_free)(zend_mm_storage *storage, zend_mm_segment *ptr);
} zend_mm_mem_handlers;

struct _zend_mm_storage {
  const zend_mm_mem_handlers *handlers;
  void *data;
};
```

我们看看存储层（storage）的初始化函数zend_mm_startup():

```
ZEND_API zend_mm_heap *zend_mm_startup(void)
{
  int i;
  size_t seg_size;
  char *mem_type = getenv("ZEND_MM_MEM_TYPE"); //内存分配方案
  char *tmp;
  const zend_mm_mem_handlers *handlers;
  zend_mm_heap *heap;

  if (mem_type == NULL) { //默认使用malloc为分配方案，也就是0
    i = 0;
  } else {
    for (i = 0; mem_handlers[i].name; i++) {
      if (strcmp(mem_handlers[i].name, mem_type) == 0) { 
        break;
      }
    }
    if (!mem_handlers[i].name) {
      fprintf(stderr, "Wrong or unsupported zend_mm storage type '%s'\n", mem_type);
      fprintf(stderr, "  supported types:\n");
/* See http://support.microsoft.com/kb/190351 */
#ifdef PHP_WIN32
      fflush(stderr);
#endif
      for (i = 0; mem_handlers[i].name; i++) {
        fprintf(stderr, "    '%s'\n", mem_handlers[i].name);
      }
/* See http://support.microsoft.com/kb/190351 */
#ifdef PHP_WIN32
      fflush(stderr);
#endif
      exit(255);
    }
  }
  handlers = &mem_handlers[i];
  //使用相应内存分配方案的handler，mem_handlers是结构体zend_mm_mem_handlers

  tmp = getenv("ZEND_MM_SEG_SIZE"); 
  if (tmp) {
    seg_size = zend_atoi(tmp, 0);
    if (zend_mm_low_bit(seg_size) != zend_mm_high_bit(seg_size)) {
      fprintf(stderr, "ZEND_MM_SEG_SIZE must be a power of two\n");
/* See http://support.microsoft.com/kb/190351 */
#ifdef PHP_WIN32
      fflush(stderr);
#endif
      exit(255);
    } else if (seg_size < ZEND_MM_ALIGNED_SEGMENT_SIZE + ZEND_MM_ALIGNED_HEADER_SIZE) {
      fprintf(stderr, "ZEND_MM_SEG_SIZE is too small\n");
/* See http://support.microsoft.com/kb/190351 */
#ifdef PHP_WIN32
      fflush(stderr);
#endif
      exit(255);
    }
  } else {
    seg_size = ZEND_MM_SEG_SIZE; //段分配大小，未指定的话默认为ZEND_MM_SEG_SIZE，即(256 * 1024)
  }

  heap = zend_mm_startup_ex(handlers, seg_size, ZEND_MM_RESERVE_SIZE, 0, NULL);
  //初始化heap
  if (heap) {
    tmp = getenv("ZEND_MM_COMPACT"); 
    if (tmp) {
      heap->compact_size = zend_atoi(tmp, 0);
    } else {
      heap->compact_size = 2 * 1024 * 1024;
    }
  }
  return heap;
}
```

其中mem_handlers里面是4种内存分配方案：

![4r26LI](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/4r26LI.jpg)

# 堆层（heap）

我们先看看heap的结构：

```
struct _zend_mm_heap {
    int                 use_zend_alloc;
    void               *(*_malloc)(size_t);
    void                (*_free)(void*);
    void               *(*_realloc)(void*, size_t);
    size_t              free_bitmap;
    size_t              large_free_bitmap;
    size_t              block_size;
    size_t              compact_size;
    zend_mm_segment    *segments_list;
    zend_mm_storage    *storage;
    size_t              real_size;
    size_t              real_peak;
    size_t              limit;
    size_t              size;
    size_t              peak;
    size_t              reserve_size;
    void               *reserve;
    int                 overflow;
    int                 internal;
#if ZEND_MM_CACHE
    unsigned int        cached;
    zend_mm_free_block *cache[ZEND_MM_NUM_BUCKETS];
#endif
    zend_mm_free_block *free_buckets[ZEND_MM_NUM_BUCKETS*2];
    zend_mm_free_block *large_free_buckets[ZEND_MM_NUM_BUCKETS];
    zend_mm_free_block *rest_buckets[2];
    int                 rest_count;
#if ZEND_MM_CACHE_STAT
    struct {
        int count;
        int max_count;
        int hit;
        int miss;
    } cache_stat[ZEND_MM_NUM_BUCKETS+1];
#endif
};
```

其中free_buckets 和 large_free_buckets 是关键，它们分别是小块内存列表和大块内存列表，在接口层申请内存的时候，ZendMM会在heap层中搜索合适大小的内存块，small类型的使用free_buckets，large类型则使用large_free_buckets，如果都没有足够的内存的话，就使用rest_buckets。经过以上步骤还没有合适的资源的话，使用ZEND_MM_STORAGE_ALLOC函数向系统再申请一块内存。

之前的zend_mm_startup()函数调用zend_mm_startup_ex()来初始化堆层（heap），这里我们只说一下其中的zend_mm_init()，我们看看它的实现：

```
static inline void zend_mm_init(zend_mm_heap *heap)
{
  zend_mm_free_block* p;
  int i;

  heap->free_bitmap = 0; //小块空闲内存标识
  heap->large_free_bitmap = 0; //大块空闲内存标识
#if ZEND_MM_CACHE
  heap->cached = 0;
  memset(heap->cache, 0, sizeof(heap->cache));
#endif
#if ZEND_MM_CACHE_STAT
  for (i = 0; i < ZEND_MM_NUM_BUCKETS; i++) {
    heap->cache_stat[i].count = 0;
  }
#endif
  p = ZEND_MM_SMALL_FREE_BUCKET(heap, 0);
  for (i = 0; i < ZEND_MM_NUM_BUCKETS; i++) {
    p->next_free_block = p;
    p->prev_free_block = p;
    p = (zend_mm_free_block*)((char*)p + sizeof(zend_mm_free_block*) * 2);
    heap->large_free_buckets[i] = NULL;
  }
  heap->rest_buckets[0] = heap->rest_buckets[1] = ZEND_MM_REST_BUCKET(heap);
  heap->rest_count = 0;
}
```

我们先看看鸟哥画的Heap结构图：

![TJ6pEQ](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/TJ6pEQ.jpg)

再回到zend_mm_init()，这里同时初始化free_buckets 和 large_free_buckets。其实他们就像Hashtable一样，每个bucket也对应一定大小的内存块列表。

free_buckets使用宏`ZEND_MM_SMALL_FREE_BUCKET`来管理分配小块内存：

```
#define ZEND_MM_SMALL_FREE_BUCKET(heap, index) \
  (zend_mm_free_block*) ((char*)&heap->free_buckets[index * 2] + \
    sizeof(zend_mm_free_block*) * 2 - \
    sizeof(zend_mm_small_free_block))
```

free_buckets是一个数组指针，它存储的是指向zend_mm_free_block结构体的指针，他们以两个为一对，分别存储双向链表的头尾指针。如图：

![DDTZ3s](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/DDTZ3s.jpg)

这里的初始化非常巧妙，我们先看看`ZEND_MM_SMALL_FREE_BUCKET`，它是将free_buckets列表的偶数位的内存地址(也就是指向prev_free_block的地址)加上两个指针的内存大小并减去zend_mm_small_free_block结构所占空间的大小。而因为zend_mm_free_block结构和zend_mm_small_free_block结构的差距在于两个指针，所以他的计算结果就是free_buckets列表index对应双向链表的第一个zend_mm_free_block的prev_free_block地址减8的地址。为什么是减8的地址？因为zend_mm_free_block的前8个字节是zend_mm_block_info，之后才是prev_free_block。两个结构体如下：

```
typedef struct _zend_mm_small_free_block {
  zend_mm_block_info info;
#if ZEND_DEBUG
  unsigned int magic;
# ifdef ZTS
  THREAD_T thread_id;
# endif
#endif
  struct _zend_mm_free_block *prev_free_block;
  struct _zend_mm_free_block *next_free_block;
} zend_mm_small_free_block;

typedef struct _zend_mm_free_block {
  zend_mm_block_info info;
#if ZEND_DEBUG
  unsigned int magic;
# ifdef ZTS
  THREAD_T thread_id;
# endif
#endif
  struct _zend_mm_free_block *prev_free_block;
  struct _zend_mm_free_block *next_free_block;  
 
  struct _zend_mm_free_block **parent;         
  struct _zend_mm_free_block *child[2];         
} zend_mm_free_block;
```

为了方面理解，看下图。我们假设index为0的情况，&heap->free_buckets[0] 的地址为0x881260，加上sizeof(zend_mm_free_block*)* 2 再减去sizeof(zend_mm_small_free_block))的结果 0x881258，它是&heap->free_buckets[0]地址减8的地址，它指向的结构体 zend_mm_free_block，所以p->prev_free_block指向的就是0x881260，也就是heap->free_buckets[0]。

![b87C4t](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/b87C4t.jpg)

接着后面的代码：

```
p = ZEND_MM_SMALL_FREE_BUCKET(heap, 0);
for (i = 0; i < ZEND_MM_NUM_BUCKETS; i++) {
    p->next_free_block = p;
    p->prev_free_block = p;
    p = (zend_mm_free_block*)((char*)p + sizeof(zend_mm_free_block*) * 2);
    heap->large_free_buckets[i] = NULL;
}
```

在这个循环中，free_buckets的偶数位index，将其next_free_block和prev_free_block都指向自己，通过两个指针的大小(sizeof(zend_mm_free_block*)* 2)实现数组元素的向后移动，index 0->2->4->……->62 。这种不存储zend_mm_free_block数组，仅存储其指针的方式不可不说精妙。虽然在理解上有一些困难，但是节省了内存。鸟哥是这样说的：

> this is a tricky way to store ZEND_MM_NUMER_BUCKET into a fixed length array. 
and only the prev_free_block and next_free_block will be use in that way, looking at the picture above, the red box. 
so actually there is same ZEND_MM_NUMBER_BUCKET buckets stored in the free_buckets array.
> 

所以上一张图所示的free_buckets，在经过初始化后，内容为：

![qgXzU4](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/qgXzU4.jpg)

# 接口层（emalloc/efree）

PHP实现了emalloc、efree等函数，当程序需要内存的时候，ZendMM会在内存池中分配相应的内存，这样避免了PHP向系统频繁的内存申请操作，节省了系统开销。

ZendMM在分配内存主要是有以下步骤：

**1：** 计算出ture_size，即内存对齐。如果所需要的内存的大小的低三位不为0（不能为8整除），则将低三位加上7，并与~7进行按位与操作，即对于大小不是8的整数倍的内存大小补全到可以被8整除。

```
#define ZEND_MM_TRUE_SIZE(size)             ((size<ZEND_MM_MIN_SIZE)?(ZEND_MM_ALIGNED_MIN_HEADER_SIZE):(ZEND_MM_ALIGNED_SIZE(size+ZEND_MM_ALIGNED_HEADER_SIZE+END_MAGIC_SIZE)))
```

**2：** 通过`ZEND_MM_MAX_SMALL_SIZE`判断出内存大小类型是small还是large，如果是small，则跳到3，large跳到6。(之前也有写到，小于272Byte的内存为小块内存)

**3：** 计算出要申请的内存大小对应的index。

它的相关函数(即需要分配的内存大小对应的index)为：

```
#define ZEND_MM_BUCKET_INDEX(true_size) ((true_size>>ZEND_MM_ALIGNMENT_LOG2)-(ZEND_MM_ALIGNED_MIN_HEADER_SIZE>>ZEND_MM_ALIGNMENT_LOG2))
```

在默认情况下，ZEND_MM_ALIGNMENT = 8，ZEND_MM_ALIGNMENT_LOG2 = 3，ZEND_MM_ALIGNED_MIN_HEADER_SIZE = 16。通过这个宏可以知道，内存大小与index的关系是：

| 内存大小 | index |
| --- | --- |
| 1 - 23 | 0 |
| 24 - 31 | 1 |
| 32 - 39 | 2 |
| … | … |
| 264 - 271 | 31 |

所以，小于272Byte的内存为小块内存。如果大于271Byte的话，则index为32，会使free_buckets数组越界。这样，ZendMM就可以快速定位到最可能适合的区域来查找，提高性能。就像哈希函数一样。

**4：** 如果Cache存在的话，即heap→cache[index]存在，则使用这片cache。（CACHE默认开启）

```
best_fit = heap->cache[index];
```

**5：**如果未找到Cache，则从free_buckets查找是否存在空闲内存。

```
bitmap = heap->free_bitmap >> index;
    if (bitmap) {
      /* Found some "small" free block that can be used */
      index += zend_mm_low_bit(bitmap);
      best_fit = heap->free_buckets[index*2];
#if ZEND_MM_CACHE_STAT
      heap->cache_stat[ZEND_MM_NUM_BUCKETS].hit++;
#endif
      goto zend_mm_finished_searching_for_block;
    }
```

**5.1：**首先看看free_buckets中剩余的内存是否满足true_size。（将heap->free_bitmap 右移index次，不为0则有空闲内存）

```
bitmap = heap->free_bitmap >> index;
   if (bitmap) {
}
```

**5.2：**根据内存大小找到最小块内存。

```
index += zend_mm_low_bit(bitmap);
```

这里说一下zend_mm_low_bit和zend_mm_high_bit。他们就像哈希函数一样，将不同大小的内存映射到不同的index，使ZendMM快速定位，提高性能。

zend_mm_low_bit实现如下：

```
static inline unsigned int zend_mm_low_bit(size_t _size)
{
#if defined(__GNUC__) && (defined(__native_client__) || defined(i386))
  unsigned int n;

  __asm__("bsfl %1,%0\n\t" : "=r" (n) : "rm"  (_size));
  return n;
#elif defined(__GNUC__) && defined(__x86_64__)
        unsigned long n;

        __asm__("bsf %1,%0\n\t" : "=r" (n) : "rm"  (_size));
        return (unsigned int)n;
#elif defined(_MSC_VER) && defined(_M_IX86)
  __asm {
    bsf eax, _size
  }
#else
  static const int offset[16] = {4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0};
  unsigned int n;
  unsigned int index = 0;

  n = offset[_size & 15];
  while (n == 4) {
    _size >>= 4;
    index += n;
    n = offset[_size & 15];
  }

  return index + n;
#endif
}
```

看看汇编和后面的C语言实现的方式就懂了，即bit scan forward，从低位向高位扫描，返回遇到1的比特位数。比如：bitmap为52(00110100)，那么返回值为2。可以看出，ZEND_MM_BUCKET_INDEX和zend_mm_low_bit结合起来，才是free_buckets的hash映射函数。

zend_mm_high_bit则为large_free_buckets的hash映射函数。

```
#define ZEND_MM_LARGE_BUCKET_INDEX(S) zend_mm_high_bit(S)

static inline unsigned int zend_mm_high_bit(size_t _size)
{
#if defined(__GNUC__) && (defined(__native_client__) || defined(i386))
  unsigned int n;

  __asm__("bsrl %1,%0\n\t" : "=r" (n) : "rm"  (_size));
  return n;
#elif defined(__GNUC__) && defined(__x86_64__)
  unsigned long n;

        __asm__("bsr %1,%0\n\t" : "=r" (n) : "rm"  (_size));
        return (unsigned int)n;
#elif defined(_MSC_VER) && defined(_M_IX86)
  __asm {
    bsr eax, _size
  }
#else
  unsigned int n = 0;
  while (_size != 0) {
    _size = _size >> 1;
    n++;
  }
  return n-1;
#endif
}
```

zend_mm_high_bit是bit scan reverse，也是从低位向高位扫描，但它是返回遇到最高位1的比特位数。比如：bitmap为512(1000000000)，那么返回值为9。

**5.3：** 成功分配内存并返回。

**6：** 如果free_buckets没有找到合适的内存，则进入zend_mm_search_large_block，在large_free_buckets中寻找合适的内存。

```
best_fit = zend_mm_search_large_block(heap, true_size);
```

**6.1：**使用前面说过的宏ZEND_MM_LARGE_BUCKET_INDEX，来查找true_size对应的large_free_buckets。

```
size_t index = ZEND_MM_LARGE_BUCKET_INDEX(true_size);
```

**6.2：**和之前小块内存分配的逻辑一样，看看large_free_buckets中剩余的内存是否满足true_size。（将heap->free_bitmap 右移index次，不为0则有空闲内存）

```
size_t bitmap = heap->large_free_bitmap >> index;

if (bitmap == 0) {
  return NULL;
}
```

**6.3：**看看large_free_buckets[index]是否存在可用的内存。

```
if (UNEXPECTED((bitmap & 1) != 0)) {
}
```

large_free_buckets是一种字典树，如果large_free_buckets[index]中的内存大小和true_size相等，则返回这块内存。

如果没有找到大小相等的内存，则寻找最小的“大块内存”。

```
best_fit = p = heap->large_free_buckets[index + zend_mm_low_bit(bitmap)];
while ((p = p->child[p->child[0] != NULL])) {
  if (ZEND_MM_FREE_BLOCK_SIZE(p) < ZEND_MM_FREE_BLOCK_SIZE(best_fit)) {
    best_fit = p;
  }
}
```

其中，`p = p→child[p→child[0] != NULL]` ，是寻找最小的block。

**7：** 如果free_bucket和large_free_buckets都没有找到合适的内存，那么只好去搜索rest_buckets了。

```
if (!best_fit && heap->real_size >= heap->limit - heap->block_size) {
  zend_mm_free_block *p = heap->rest_buckets[0];
  size_t best_size = -1;
```

**8：**如果以上都没有合适的内存的话（有可能是初始化的时候，或者内存不足的情况），申请一块段内存。

```
segment = (zend_mm_segment *) ZEND_MM_STORAGE_ALLOC(segment_size);
```

然后将这块新segment的第一块block作为best_fit使用。

```
best_fit = (zend_mm_free_block *) ((char *) segment + ZEND_MM_ALIGNED_SEGMENT_SIZE);
ZEND_MM_MARK_FIRST_BLOCK(best_fit);
block_size = segment_size - ZEND_MM_ALIGNED_SEGMENT_SIZE - ZEND_MM_ALIGNED_HEADER_SIZE;
ZEND_MM_LAST_BLOCK(ZEND_MM_BLOCK_AT(best_fit, block_size));
```

segment的结构如下图：

![0LGJRs](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/0LGJRs.jpg)

**9：** 最后，将新的block放入large_free_buckets/free_buckets/rest_buckets。

```
zend_mm_free_block *new_free_block;

/* prepare new free block */
ZEND_MM_BLOCK(best_fit, ZEND_MM_USED_BLOCK, true_size);
new_free_block = (zend_mm_free_block *) ZEND_MM_BLOCK_AT(best_fit, true_size);
ZEND_MM_BLOCK(new_free_block, ZEND_MM_FREE_BLOCK, remaining_size);

/* add the new free block to the free list */
if (EXPECTED(!keep_rest)) {
  zend_mm_add_to_free_list(heap, new_free_block);
} else {
  zend_mm_add_to_rest_list(heap, new_free_block);
}
```

通过zend_mm_add_to_free_list可以看到large_free_bucket和free_buckets的分配方式。如果new_free_block是大块内存，则将它分配到large_free_buckets。

```
index = ZEND_MM_LARGE_BUCKET_INDEX(size); //通过ZEND_MM_LARGE_BUCKET_INDEX定位到size对应的index
p = &heap->large_free_buckets[index];
mm_block->child[0] = mm_block->child[1] = NULL; 
if (!*p) { //如果large_free_buckets[index]不存在，则直接写入。
  *p = mm_block;
  mm_block->parent = p;
  mm_block->prev_free_block = mm_block->next_free_block = mm_block;
  heap->large_free_bitmap |= (ZEND_MM_LONG_CONST(1) << index); //large_free_bitmap为可用大块内存大小
} else {
  size_t m;

  for (m = size << (ZEND_MM_NUM_BUCKETS - index); ; m <<= 1) {
    zend_mm_free_block *prev = *p;

    if (ZEND_MM_FREE_BLOCK_SIZE(prev) != size) { //block的大小和size的大小不一样时，存入使其成为best_fit
      p = &prev->child[(m >> (ZEND_MM_NUM_BUCKETS-1)) & 1]; //这里的m是size先左移(ZEND_MM_NUM_BUCKETS - index)，后(ZEND_MM_NUM_BUCKETS-1))，说白了就是将size右移至剩余的高两位。 比如size为1024，则这里(m >> (ZEND_MM_NUM_BUCKETS-1))的结果是10 。如果最后一位为0，则将mm_block放入child[0]，最后一位是1，mm_block放入child[1]。相应地，在zend_mm_search_large_block中，使用m = true_size << (ZEND_MM_NUM_BUCKETS - index)，将size左移(32-size位数)位，最高位0，则取child[0]，最高位1，则取child[1]。
      if (!*p) {
        *p = mm_block;
        mm_block->parent = p;
        mm_block->prev_free_block = mm_block->next_free_block = mm_block;
        break;
      }
    } else { //block的大小和size的大小一样时，之前存入zend_mm_block中，本质是一个双向链表。
      zend_mm_free_block *next = prev->next_free_block;

      prev->next_free_block = next->prev_free_block = mm_block;
      mm_block->next_free_block = next;
      mm_block->prev_free_block = prev;
      mm_block->parent = NULL;
      break;
    }
  }
}
```

large_free_buckets的结构如下图：

![cE8Ivb](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/cE8Ivb.jpg)

下面，说说ZendMM在释放内存的过程，跟分配内存的过程相反：

**1：** 如果p是一个合法的指针，计算其对应的block，和block的大小。

```
if (!ZEND_MM_VALID_PTR(p)) {
  return;
}

HANDLE_BLOCK_INTERRUPTIONS();

mm_block = ZEND_MM_HEADER_OF(p);
size = ZEND_MM_BLOCK_SIZE(mm_block);
ZEND_MM_CHECK_PROTECTION(mm_block);
```

**2：**如果size是小块内存且cache未满(最大ZEND_MM_CACHE_SIZE)，计算其对应的index，将mm_block放入cache[index]。（CACHE默认开启，其中ZEND_MM_SMALL_SIZE、ZEND_MM_BUCKET_INDEX在前面分配内存的时候讲过）

```
#if ZEND_MM_CACHE
  if (EXPECTED(ZEND_MM_SMALL_SIZE(size)) && EXPECTED(heap->cached < ZEND_MM_CACHE_SIZE)) {
    size_t index = ZEND_MM_BUCKET_INDEX(size); 
    zend_mm_free_block **cache = &heap->cache[index];

    ((zend_mm_free_block*)mm_block)->prev_free_block = *cache;
    *cache = (zend_mm_free_block*)mm_block;
    heap->cached += size;
    ZEND_MM_SET_MAGIC(mm_block, MEM_BLOCK_CACHED);
#if ZEND_MM_CACHE_STAT
    if (++heap->cache_stat[index].count > heap->cache_stat[index].max_count) {
      heap->cache_stat[index].max_count = heap->cache_stat[index].count;
    }
#endif
  }
```

**3：**如果size是大块内存或者cache已满，且mm_block的前一块或者后一块block是空闲块，则调用zend_mm_remove_from_free_list将其删除（将下一个节点/上一节点合并）。如果mm_block为segment的第一块，则使用zend_mm_del_segment删除这个segment。否则就使用zend_mm_add_to_free_list将mm_block加入large_free_buckets/free_buckets/rest_buckets。

```
next_block = ZEND_MM_BLOCK_AT(mm_block, size);
if (ZEND_MM_IS_FREE_BLOCK(next_block)) {
  zend_mm_remove_from_free_list(heap, (zend_mm_free_block *) next_block);
  size += ZEND_MM_FREE_BLOCK_SIZE(next_block);
}
if (ZEND_MM_PREV_BLOCK_IS_FREE(mm_block)) {
  mm_block = ZEND_MM_PREV_BLOCK(mm_block);
  zend_mm_remove_from_free_list(heap, (zend_mm_free_block *) mm_block);
  size += ZEND_MM_FREE_BLOCK_SIZE(mm_block);
}
if (ZEND_MM_IS_FIRST_BLOCK(mm_block) &&
    ZEND_MM_IS_GUARD_BLOCK(ZEND_MM_BLOCK_AT(mm_block, size))) {
  zend_mm_del_segment(heap, (zend_mm_segment *) ((char *)mm_block - ZEND_MM_ALIGNED_SEGMENT_SIZE));
} else {
  ZEND_MM_BLOCK(mm_block, ZEND_MM_FREE_BLOCK, size);
  zend_mm_add_to_free_list(heap, (zend_mm_free_block *) mm_block);
}
```

其中zend_mm_remove_from_free_list也只是将large_free_buckets/free_buckets/rest_buckets中mm_block的相关指针销毁，将回收到内存池中。

# 小结

PHP的内存管理实现了自己的内存池，使得PHP内核在真正使用内存之前，先申请一块内存，当我们申请内存时就从内存池中分出一部分内存块，若内存块不够再继续申请新的内存，提高了内存分配的效率。PHP还实现了垃圾回收机制（Garbage Collection）及写时复制（Copy On Write）以进一步优化。

以上文章仅仅是我个人(当然主要还是那些参考资料)的理解，有什么错误的地方还请指正。

# 参考资料

1. [http://www.kancloud.cn/kancloud/php-internals/42794](http://www.kancloud.cn/kancloud/php-internals/42794)
2. [https://wiki.php.net/internals/zend_mm](https://wiki.php.net/internals/zend_mm)
3. [http://www.phppan.com/php-source-analytics/](http://www.phppan.com/php-source-analytics/)
4. [http://www.laruence.com/2011/11/09/2277.html](http://www.laruence.com/2011/11/09/2277.html)
5. [https://github.com/php/php-src/blob/PHP-5.4/Zend/zend_alloc.c](https://github.com/php/php-src/blob/PHP-5.4/Zend/zend_alloc.c)