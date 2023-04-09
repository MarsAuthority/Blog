---
title: N-gram在安全领域的应用
tags:
  - 博客
  - 机器学习
  - 入侵检测
order: 111112
---

## 什么是N-Gram？

N-Gram是一种在自然语言处理(NLP)中常用的一种概率语言模型(Probabilistic Language Model)，常用于语音\手写识别、机器翻译、拼写纠错等等领域。

它的本质就是计算一个句子或者一连串词出现的概率。

```python
/*
T 是由 W1,W2,W3,W4,W5 ... Wn组成的一个句子。
*/

P(T) = P(W1,W2,W3,W4,W5 ... Wn) //这个句子出现的概率是里面每一个词出现的概率的叠加。

P(W5|W1,W2,W3,W4) //已经出现第1个至第4个的词的情况下，第5个词出现的概率。
```

比如：

![Google](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/r9iFeU.jpg)

I am working 后面很有可能出现`at`, `in`, `for` ，而不是`refrigerator`, `throw`, `gull`。那么如何计算N-Grams呢？我们可以使用链式法则([Chain Rule](https://en.wikipedia.org/wiki/Chain_rule_(probability)))，求多个关联事件并存时的概率：

- 2个事件同时发生的概率：**P(a, b) = P(a | b) * P(b)**
- 3个事件的概率链式调用：**P(a, b, c) = P(a | b, c) * P(b, c) = P(a | b, c) * P(b | c) * P(c)**
- 推广到N个事件，概率链式法则为：**P(X1, X2, ... Xn) = P(X1 | X2, X3 ... Xn) * P(X2 | X3, X4 ... Xn) ... P(Xn-1 | Xn) * P(Xn)**

但是这样会有两个问题：

1. 参数空间过大，不可能实用化。（N越大越难计算）
2. 数据稀疏严重，语言有各种各样的组合，数据量太大，无法获取这么全的数据。

所以为了简化这个问题，我们引入马尔科夫假设（Markov Assumption）：”一个词的出现仅仅依赖于它前面出现的一个或者有限的几个词。”

1. 如果一个词的出现仅仅依赖于它本身，我们称之为 Uni-gram model : `P(T) = P(W1)P(W2)...P(Wn)`
2. 如果一个词的出现仅仅依赖于它前面出现的一个词，我们称之为 Bi-gram model : `P(T) = P(W1)P(W2|W1)P(W3|W2)...P(Wn|Wn-1)`
3. 如果一个词的出现仅仅依赖于它前面出现的两个词，我们称之为 Tri-gram model : `P(T) = P(W1)P(W3|W1,W2)...P(Wn|Wn-2,Wn-1)`
4. 依次类推到仅依赖于它前面出现的N个词，还有4-gram, 5-gram。

下面用Bi-gram举个例子，语料库来自 [[Berkeley Restaurant Project]](http://www1.icsi.berkeley.edu/Speech/berp.html) ，总词数为 10132。

词和词频率：

| i | want | to | eat | chinese | food | lunch | spend |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2533 | 927 | 2417 | 746 | 158 | 1093 | 341 | 278 |

词序列频率：

| * | i | want | to | eat | chinese | food | lunch | spend |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| i | 5 | 827 | 0 | 9 | 0 | 0 | 0 | 2 |
| want | 2 | 0 | 608 | 1 | 6 | 6 | 5 | 1 |
| to | 2 | 0 | 4 | 686 | 2 | 0 | 6 | 211 |
| eat | 0 | 0 | 2 | 0 | 16 | 2 | 42 | 0 |
| chinese | 1 | 0 | 0 | 0 | 0 | 82 | 1 | 0 |
| food | 15 | 0 | 15 | 0 | 1 | 4 | 0 | 0 |
| lunch | 2 | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| spend | 1 | 0 | 1 | 9 | 0 | 0 | 0 | 0 |

根据上表我们可以直观的看出，在这八个词的组合中，概率最高的句子是： i want to eat lunch 。它的概率是 P(i want to eat lunch) = P(i)P(want|i)P(to|want)P(eat|to)P(lunch|eat) = 2533/10132 * *827/2533* * 608/927 * *686/2417* * 42/746 = 0.25 * *0.326* * 0.656 * *0.284* * 0.056 = 0.00085

### Smoothing

随着N-Grams的N的增大，N-Grams的数量对越来越多。如果词表中有10000个词，Bi-Gram模型可能产生100000000个N-Gram，Tri-Gram模型则可能产生1000000000000个N-Gram，那么会出现(unseen events)，词库中的某些词在训练样本中没有的情况（比如`in`在训练样本中没有出现在`turn`
后面）。为了避免在这种情况下概率为0，我们使用Smoothing来解决。

1. add-1 smoothing : 很简单，给所有统计的counts加 1 。
2. add-k smoothing : 将高概率分到unseen events，在计算概率的时候，选择一个合适的k值。
    
    ![add-k](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/MEKSo5.jpg)
    
3. backoff ： 如果Tri-gram统计为0，就去看Bi-gram，以此类推。
4. interpolation : 以权重，将Tri-gram，Bi-gram，Uni-gram综合起来。（举例）
5. kneser-ney smoothing : 以地位向高位，或者高位向地位的方向，传递高频。

## 使用Python生成N-grams

简单的实现：

```python
class NGram(object):
	def __init__(self, text, n=3):
		self.n = n
		self.table = {}
		self.parse_text(list(text), n)

	def parse_text(self, text, n):
		for letter in zip(*[text[i:] for i in range(n)]):
			self.table[''.join(letter)] = self.table.get(''.join(letter), 0) + 1 # increment count

print NGram("abcdef", n=3).table
```

## NIDS中的应用

### 案例一

Ke Wang 和 Salvatore J. Stolfo 在《Anomalous Payload-based Network Intrusion Detection 》中提出了一种基于1-Gram的方法，将数据包以端口分类，相同端口的数据包再以不同的长度分类，然后计算出ASCII字符0-255的平均分布频率，作为一个特征，加上平均分布频率的平均值，方差，标准差作为另一个特征。有了这两个特征，就可以在异常检测中建立模型，完成任务。如下图：

![案例一](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/qvrUtF.jpg)

整个思路是：是训练阶段，算出不同端口/长度数据包的平均字节概率分布模型(平均值，方差，标准差)，预测阶段，算出新数据包的字节概率分布模型，使用马氏距离(Mahalanobis distance)，比较两个模型的差异，当差异超过某个阈值的时候，则检测出异常。还加上了增量学习(Incremental learning)使整个模型随着新数据的到来，不断的更新自己的参数(平均值，方差，标准差)，”淘汰”旧数据，”更新”新数据。

文中还提到了一种实现签名检测的方法：将字节的平均概率分布图，把频率从高到低进行重排序。这样得出的分布图很像Zipf-like分布(指数函数/幂函数少数值频繁出现，多数值偶尔出现。通俗地讲，就是二八原则：80%的财富集中在20%的人手中……80%的用户只使用20%的功能……20%的用户贡献了80%的访问量……)，这样用很小的长度就表示了整个ASCII范围的平均概率分布。比如下图，重排序后只用83个unique 的字符就表示了整个平均概率分布。

![案例一](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/frPmAf.jpg)

通过这种方法将已识别/确认的异常数据包做成签名(signature)，可以快速准确地检测其他地方可能出现的相同异常数据包。

### 案例二

前面说到的方法是1-Gram的应用，然而1-Gram的简单性(平均字节概率分布)很容易受到拟态攻击(mimicry attacks)，攻击者可以通过填充无用字符的方法来伪造出正常的概率分布，从而绕过检测。于是他们又提出了基于N-gram N大于1 的方法。见《Anagram: A Content Anomaly Detector Resistant to Mimicry Attack》

N-gram的本质和1-Gram是一样的，只不过特征空间变大大，在计算的时间/内存开销也很大。比如一个TCP 数据包，长度是256，那么他的N-garm就有256^n。作者通过选取几个N值，比如3-Gram, 4-Gram, 5-Gram等等，然后用Bloom filter(原理相当于哈希表)进行存储。最后在ROC曲线中比较这些N-gram的召回率与准确率，选取合适的模型。如图：

![案例二](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/JsmuVT.jpg)

其他细节就略过，感兴趣可以自己查阅。

## 其他应用

N-gram在安全领域还有很多其他的应用，比如HIDS(通过系统调用做异常检测)、恶意软件分类/识别、敏感词识别/屏蔽等等。但是效果却不好，误报、漏报严重。原因之前也提过，比如：测试还在用DARPA1999, KDD99等老样本、模型存在偏差样本性、缺乏实践等等问题。

开源项目参考：

[https://github.com/chwress/salad](https://github.com/chwress/salad)

## 参考资料

1. [Anomalous Payload-based Network Intrusion Detection](http://academiccommons.columbia.edu/catalog/ac%3A125704)
2. [Anagram: A Content Anomaly Detector Resistant to Mimicry Attack](http://ids.cs.columbia.edu/sites/default/files/anagram-camera-fixed.pdf)
3. [N-Grams tutorial](https://lagunita.stanford.edu/c4x/Engineering/CS-224N/asset/slp4.pdf)
4. [N-Grams wikipedia](https://en.wikipedia.org/wiki/N-gram)

⌥E