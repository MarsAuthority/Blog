---
title: 利用Calibre.recipe爬取文章
tags:
  - 博客
  - 爬虫
---

## 前言

多读书，读好书很重要，网上的有些精品资源只能在线一页一页翻着看，颇不方便，故研究了一下Calibre，用其强大的爬虫功能抓取这些文章，并自动生成带目录索引的电子书文件(mobi、epub)，以便在Kindle上随时阅读。

## 编写recipe脚本

`Calibre` 就不再介绍了，可以自行百度。

recipe 其实就是一段python代码，定义 calibre 的抓取行为，通过 Beautiful Soup 筛选出页面中要抓取的元素。相关文档参考：

> Beautiful Soup 4.2.0 DocumentationAPI Documentation for recipes
> 

简单来说，recipe 是一个固定的模板。找到要抓取的目录和每个目录项链接到相应内容页的正文的Dom元素即可。

下面以抓取《詩詞金庸》[http://jinyong.ylib.com/works/v1.0/works/poem.htm](http://jinyong.ylib.com/works/v1.0/works/poem.htm) 为例：

```python
#-*-coding:utf-8-*-
from calibre.web.feeds.recipes import BasicNewsRecipe

class LouisChaPoem(BasicNewsRecipe):
	title = u'诗词金庸'
	description = u'金庸小說裡出現過的詩詞何其多！但你可知道，書中主角口中吟唱的詞句，究竟是金庸自己作的，還是「移花接木」引過來的呢？卻又是引自何處，原典為何？哈！好奇吧！在閱讀金庸小說之際，千萬別忽略了這許多有趣的中國傳統文化事物。就讓我們從古典詩詞開始尋根，一探金庸文化「寶山」，可別空手而回哦！ '
	url_prefix = 'http://jinyong.ylib.com/works/v1.0/works/'
	no_stylesheets = True
	keep_only_tags = [ #保留文章正文
		dict(name='font', attrs={'color':['#003366']}),
	  	dict(name='td', attrs={'colspan':['3']})
	]
	remove_tags = [ #去除多余元素
		dict(name='font', attrs={'color':['#CC3333']})
	]
	max_articles_per_feed = 999 #爬取的文章数目限制
	def get_title(self, link):
		return link.string
	def parse_index(self):
		soup = self.index_to_soup('http://jinyong.ylib.com/works/v1.0/works/poem.htm')
		articles = []
		for i in soup.findAll("tr",{"class":"new"}):
			for link in i.findAll("a"):
				title = self.get_title(link)
				title = title.encode("utf-8")
				url = self.url_prefix+link["href"]
				a = {'title': title , 'url':url}
				articles.append(a)
		ans = [(self.title,articles)]
		return ans
```

代码保存为 `LouisChaPoem.recipe` 。整个代码比较简单明了，就不再赘述细节了。运行 `ebook-convert LouisChaPoem.recipe LouisChaPoem.epub`  就可以抓取了。（ebook-convert在calibre的安装目录下）

## 最后

看看效果吧，正文：

![KmYDsZ](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/KmYDsZ.jpg)

最后推荐一些写好的Recipe：

> [@ericzhang-cn](https://github.com/ericzhang-cn/kindle-open-books)

> [@mine260309](https://github.com/mine260309/calibre_recipes)
