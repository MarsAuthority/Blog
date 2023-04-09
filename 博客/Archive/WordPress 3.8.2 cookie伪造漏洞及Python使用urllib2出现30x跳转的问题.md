---
title: WordPress 3.8.2 cookie伪造漏洞及Python使用urllib2出现30x跳转的问题
tags:
  - 博客
  - Python
  - WordPress
---

## 背景

首先看这篇文章：WordPress 3.8.2 cookie伪造漏洞再分析 [http://drops.wooyun.org/papers/1409](http://drops.wooyun.org/papers/1409)

推荐阅读：

[The dangers of type coercion and remote management plugins](http://joncave.co.uk/2013/03/dangers-of-type-coercion-and-remote-management/)

WordPress 3.8.2修复的一个重要漏洞是cookie伪造漏洞 [(CVE-2014-0166)](https://web.nvd.nist.gov/view/vuln/detail?vulnId=CVE-2014-0166)。该漏洞可以被攻击者利用通过伪造身份验证Cookie，登陆网站。

## 利用

具体的原理请看上面这篇文章，这里就不多重复了。

也就是说，我们只要把cookies设置成 “admin|$expiration|0”,就可以登陆后台了。

思路是：

- 1.尝试$expiration构造Cookie
- 2.GET请求到[http://www.example.com/wp-admin/profile.php](http://www.example.com/wp-admin/profile.php),根据返回的http header判断是否跳转,如为200则成功
- 3.多线程,有条件使用多机器

## 题外话

在写利用脚本的时候发现，python的urllib2.urlopen会遇到301/302自动跳转的问题，这样无法判断出http状态码是否是302。来分析看看为什么吧。:)

打开urllib2源码，刚开头就看到了相关文档：

`The HTTPRedirectHandler automatically deals with HTTP 301, 302, 303 and 307 redirect errors.`

仔细阅读源码看一下调用过程：

```python
#调用urlopen的文件
response = urllib2.urlopen(request)
#urllib2.py ,line 127, in urlopen
return _opener.open(url, data, timeout)
#urllib2.py ,line 410, in open
response = meth(req, response)
#urllib2.py ,line 523, in http_response
response = self.parent.error(
                'http', request, response, code, msg, hdrs)
#urllib2.py ,line 442, in error
result = self._call_chain(*args)
#urllib2.py ,line 382, in _call_chain
result = func(*args)
#urllib2.py ,line 608, in http_error_302
new = self.redirect_request(req, fp, code, msg, headers, newurl)
```

到这里我想已经够清楚了(执行到了我们之前在文档看到的HTTPRedirectHandler)，最后的redirect_request：

```python
def redirect_request(self, req, fp, code, msg, headers, newurl):
    """Return a Request or None in response to a redirect.

    This is called by the http_error_30x methods when a
    redirection response is received.  If a redirection should
    take place, return a new Request to allow http_error_30x to
    perform the redirect.  Otherwise, raise HTTPError if no-one
    else should try to handle this url.  Return None if you can't
    but another Handler might.
    """
    m = req.get_method()
    if (code in (301, 302, 303, 307) and m in ("GET", "HEAD")
        or code in (301, 302, 303) and m == "POST"):
        # Strictly (according to RFC 2616), 301 or 302 in response
        # to a POST MUST NOT cause a redirection without confirmation
        # from the user (of urllib2, in this case).  In practice,
        # essentially all clients do redirect in this case, so we
        # do the same.
        # be conciliant with URIs containing a space
        newurl = newurl.replace(' ', '%20')
        newheaders = dict((k,v) for k,v in req.headers.items()
                          if k.lower() not in ("content-length", "content-type")
                         )
        return Request(newurl,
                       headers=newheaders,
                       origin_req_host=req.get_origin_req_host(),
                       unverifiable=True)
    else:
        raise HTTPError(req.get_full_url(), code, msg, headers, fp)
```

所以GET遇到状态码（301, 302, 303, 307）时会Request跳转到新的地址，所以我们无法获取这些状态码(没有保存下来)。

我们需要自己写一个hander来重写30x方法处理这种情况，保存状态码。代码如下：

```python
#-*- coding:utf-8 -*-
import urllib2
#自定义hander
class SmartRedirectHandler(urllib2.HTTPRedirectHandler):
	def http_error_301(self, req, fp, code, msg, headers):
		result = urllib2.HTTPRedirectHandler.http_error_301(self, req, fp, code, msg, headers)  
		result.status = code
		return result  
	def http_error_302(self, req, fp, code, msg, headers):
		result = urllib2.HTTPRedirectHandler.http_error_302(self, req, fp, code, msg, headers)
		result.status = code
		return result

request = urllib2.Request("http://www.example.com/wp-admin/profile.php") 
opener = urllib2.build_opener(SmartRedirectHandler)
urllib2.install_opener(opener)
response = urllib2.urlopen(request)
print response.status
```

这样，就可以正常返回301/302状态码。

另外，WordPress 3.8.2补丁分析 HMAC timing attack [http://drops.wooyun.org/papers/1404](http://drops.wooyun.org/papers/1404) 思路确实很赞。

-   LunaBot
    
