---
title: Security.News@202209
tags:
  - 安全通讯 Security.News
  - 安全事件
  - 行业动态
  - TTPs动态
  - 友商动态
  - Bug Bounty
  - REvil
  - Uber
  - 绕过MFA
  - Lapsus$
---

## 安全事件
### REvil 宣布对 Midea美的集团勒索攻击事件负责，并在暗网公开了被盗的数据
8月11日，全网都在疯传Midea美的集团被勒索攻击的事件；就在事件发生20天后，9月1日，REvil 勒索软件组织正式公布，对美的集团的勒索攻击事件负责，并在暗网公开了美的集团被盗的数据。这表明美的集团与REvil谈判破裂，并未支付1000万美元勒索赎金。

![MkMY9o](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/MkMY9o.jpg)

#### 一些感悟
> 整个事件发生的原因、过程、影响面都还未披露。在勒索团队肆虐的时代，我们应该做些什么？我们还能幸存多久？

### Uber被黑客入侵至内部网络

2022年9月16日，网传uber被黑客入侵，并爆出了更多细节，攻击者还获得了对Uber云服务的管理访问权限，包括在亚马逊网络服务（AWS）和谷歌云（GCP）上，Uber在其中存储其源代码和客户数据，以及该公司的HackerOne漏洞赏金计划。

有趣的是，攻击者是一名18岁的年轻人，也和Lapsus$一样，有人戏称到：APT=Advanced Persistent Teenagers。

官方申明如下：

![Uber官方申明](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/cMuDaZ.png)

#### 攻击路径分析

![GcunMN](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/GcunMN.jpg)

1. 攻击者通过在黑市购买的凭据信息（基于Racoon恶意软件）获得了Uber员工的凭据，这点和当初Lapsus$入侵微软是一样的。

![epLMva](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/epLMva.jpg)
2. 攻击者进入内网后，发现内网存在一个网络共享文件（powershell），包含Thycotic（PAM系统）的管理员账号密码，而从Thycotic中，可以找到DA, DUO, Onelogin, AWS, GSuite之类系统的凭据。

![gbZ0JV](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/gbZ0JV.jpg)
3. 攻击者通过冒充Uber IT工作人员，并不停骚扰那名员工，最终使得员工点击通过了2FA认证，从而绕过2FA。

![6sn9BQ](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/6sn9BQ.jpg)

#### Uber回应（09/27）

1. 敏感数据未泄漏
2. 服务正常运转
3. 正在调查中

![Uber回应](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/Uq4aQF.jpg)

#### 附：相关截图

![SlN5N9](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/SlN5N9.jpg)
![RK8OrT](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/RK8OrT.jpg)
![qIZVJ8](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/qIZVJ8.jpg)
![NrsSWm](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/NrsSWm.jpg)
![hLWMGn](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/hLWMGn.jpg)

#### 一些感悟
> 通过钓鱼拿到合法凭据突破网络边界的攻击手法越来越普遍和成熟，传统的2FA策略仍无法有效阻止攻击，“人”还是最容易突破的脆弱点。
> 
> Twitter、Cloudflare、Google等越来越多的公司开始使用YubiKey这种硬件密钥的方式作为MFA来避免钓鱼攻击，但这种方式成本较高，普及还是有一定难度；还是要从人、流程、技术这三个方面来加固并持续改进，尽可能避免被钓鱼攻击利用成果。

#### 参考资料
- https://blog.cloudflare.com/2022-07-sms-phishing-attacks/
- https://blog.twitter.com/engineering/en_us/topics/insights/2021/how-we-rolled-out-security-keys-at-twitter
- https://krebsonsecurity.com/2018/07/google-security-keys-neutralized-employee-phishing/

### Optus遭泄露1120W+用户个人敏感数据

澳大利亚第二大电信公司Optus宣布它遭受了一次重大数据泄露，该事件涉及1120W+客户的敏感信息。

![IUPaux](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/IUPaux.png)

#### 发生了什么？

![JUKB5e](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/JUKB5e.jpg)

#### 攻击路径分析

1. 信息表明，数据是在 [http://api.www.optus.com.au](http://api.www.optus.com.au/) 时通过未经身份验证的 REST API 接口泄露的
2. 参数`contactid=XXXXXXXXX`存在IDOR漏洞，导致可被遍历拉取敏感数据，且该参数是一个可预测的数字序列

#### 一些感悟
> 如此简单、低级的问题依然存在……
>
> 评价安全工作的好坏不要有没有解决高大上的问题，而是能把某一个场景做精做细做好，解决实际问题；很多公司其实连基础工作都没有做好，这里想引用赵武在[网络安全行业的机会：固化最佳实践](https://mp.weixin.qq.com/s?__biz=MjM5NDQ5NjM5NQ==&mid=2651626352&idx=1&sn=80690a89bea1be4ffe21f35bf5ee431d&chksm=bd7ed1948a0958824e5aa50ac5827c978cf1d8a144c02d1a1918319446fc0e3f8604d71846a6&mpshare=1&scene=1&srcid=0123NNRIkGqmZq8ehsuOBJQr&sharer_sharetime=1674449535175&sharer_shareid=28de93b23e4052396c8ecdf9aafa26d0#rd)里面写到的
>
> 最近我老是拿我们公司的安全部门和产品部门举例，比如安全从业人员都会做资产梳理工作，输入的是企业名称，输出的是互联网暴露面清单；还比如说做IP情报画像（溯源反制），输入的是IP列表，输出的是IP对应的价值情报信息。这是基础的不能再基础的工作内容，我相信这不仅仅是我们公司的工作，而几乎是所以安全行业甲乙方都必须具备的基础技能。一方面它们实在太简单了，没有人没做过也没有人不会，另一方面它们实在太难了，同一个工作不同的人来做，效果天地之别。为什么呢？是因为似乎做了就算有交付，除非你有行之有效的对比方法，否则很有可能一个实习生在几次忐忑交付没人提出反对意见之后，都敢于提出老子天下无敌的口号。

#### 参考资料
- https://www.optus.com.au/about/media-centre/media-releases/2022/09/optus-notifies-customers-of-cyberattack

### Fast Comany被黑，导致cms被控

9月28日，Fast Comany被搞，黑客通过Apple news推送不当言论。

![75Lv2w](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/75Lv2w.jpg)
导致被黑的原因有两个：

1. 系统使用默认口令

![ZN7mty](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/ZN7mty.jpg)
2. 系统的凭据在外部已泄漏，和Uber被黑原因差不多

![d9XTwn](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/d9XTwn.jpg)

#### 参考资料
- https://twitter.com/RachelTobac/status/1574948916855914497

## 行业动态

### 网络犯罪情报公司HudsonRock提供网络犯罪数据库查询能力

HudsonRock的产品 - Cavalier和Bayonet - 由我们不断增强的网络犯罪数据库提供支持，该数据库由数百万台在全球恶意软件传播活动中受到损害的机器组成。

> 我们的高保真数据直接来自威胁主体(threat actor)，而不是来自数据库泄漏。

不确定他们数据来源是不是黑市，类似Uber入侵事件中提到的：

> 1. 攻击者通过在黑市购买的凭据信息（基于Racoon恶意软件）获得了Uber员工的凭据，这点和当初Lapsus$入侵微软是一样的。

#### 产品截图

![uiytKZ](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/uiytKZ.jpg)

地址：https://www.hudsonrock.com/search?domain=apple.com

### PolySwarm：一个去中心化的威胁情报市场

PolySwarm 是第一个由以太坊 (Ethereum) 智能合约和区块链技术实现的去中心化威胁情报市场。

PolySwarm 定义了一个实时威胁情报生态系统，其中涵盖企业用户（如银行、科技公司等）及个人用户、威胁检测引擎供应商（如赛门铁克、奇虎360、卡巴斯基等）、分布在世界各处的信息安全专家的专家竞相开发能检测最新威胁的“微型威胁检测引擎”，在平台上竞相提供更精确的威胁检测判定，提供威胁情报。想像 Airbnb, PolySwarm 提供了杀毒引擎（出租房主）和需要对文档进行威胁扫描（租客）的媒合平台。

PolySwarm 的“工作量证明”(Proof of Work) 即是微引擎对威胁检测的准确性: 以NCT 花蜜令牌奖励奖励市场中最能够保护企业和最终用户的威胁检测引擎（即其开发专家）。

### 美国管理和预算办公室 （OMB） 要求各机构NIST关于软件供应链安全的指南

NIST为软件供应链制定了最佳实践指南，NIST安全软件开发框架（SSDF），SP 800-218和NIST软件供应链安全指南。

#### 一些感悟
> 看来供应链安全也是目前美帝最迫切的安全需求之一了。

#### 参考资料
- https://www.whitehouse.gov/wp-content/uploads/2022/09/M-22-18.pdf
- https://csrc.nist.gov/publications/detail/sp/800-218/final
- https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-161r1.pdf

## TTPs动态
### 赛门铁克威胁狩猎团队在数百个应用程序中找到的内置 AWS 凭证

我们确定了 1859 个公开可用的应用程序，包括 Android 和 iOS，它们都包含硬编码的 AWS 凭证。几乎所有都是iOS应用程序（98%），这是我们多年来一直在跟踪的平台之间的趋势和差异，可能与不同的应用程序商店审查实践和政策有关。无论如何，我们检查了在应用程序内发现 AWS 凭证嵌入时所涉及的风险的范围和程度。我们发现以下内容：

- 超过四分之三 （77%） 的应用程序包含有效的 AWS 访问令牌，允许访问私有 AWS 云服务
- 这些应用程序中有近一半（47%）包含有效的AWS令牌，这些令牌还通过亚马逊简单存储服务（Amazon S3）完全访问了大量（通常是数百万个）私有文件。

#### 参考资料
- https://symantec-enterprise-blogs.security.com/blogs/threat-intelligence/mobile-supply-chain-aws

### 三分之一的 PyPI 包在下载时触发代码执行

Python 包索引 （PyPI） 中近三分之一的包在下载后自动执行代码。Checkmarx研究工程师Yehuda Gelb写道：“当安装python软件包时，python的软件包管理器pip会尝试收集和处理该软件包的元数据，例如其版本和正常工作所需的依赖项。这个过程在后台自动发生，通过运行作为包结构一部分的主 [setup.py](http://setup.py/) 脚本。攻击者可能会将恶意代码放入 [setup.py](http://setup.py/) 文件中。

#### 参考资料
- https://thehackernews.com/2022/09/warning-pypi-feature-executes-code.html

## Bug Bounty
### GitHub 环境注入漏洞影响两个开源项目

谷歌和Apache的安全研究人员在开源项目的GitHub环境中发现了持续集成/持续交付（CI / CD）漏洞。可以利用这些漏洞来控制项目的 GitHub 操作 CI/CD 管道，修改源代码、窃取数据以及在组织内横向移动。

1. “workflow_run”事件是一个独特的 GitHub 操作管道触发器，用于执行特权管道，如果不谨慎使用，可能会导致重大安全问题。
2. 数以千计的存储库使用“workflow_run”触发器。我们发现各种常见的易受攻击的工作流配置代码模式容易受到权限提升攻击，即可能使攻击者能够在 CI/CD 管道内运行高特权代码。
3. 一旦“workflow_run”权限提升漏洞被利用，攻击者就可以使用提升的权限，通过修改存储库资源（例如标签、工件、版本等）来触发供应链攻击。
4. 攻击者可以窃取存储库机密和潜在的一些组织机密，从而允许在组织内横向移动并进一步增加其攻击的影响半径。

#### 参考资料
- https://www.legitsecurity.com/blog/github-privilege-escalation-vulnerability-0

## 友商动态

### 微软将于2022年10月正式弃用Exchange Online基本身份验证

Exchange Online 团队本周表示“今天，我们宣布，自 2022 年 10 月 1 日起，我们将永久关闭所有租户的基本身份验证，无论使用情况如何(SMTP 身份验证除外，此后仍可重新启用)。”

#### 为什么基本身份验证被禁用?

虽然微软没有具体说明本周决定发布此公告的具体原因，但据推测原因可能是因为一份来自网络安全公司Guardicore的报告，该报告揭示了数十万个 Windows 域凭证泄露。Guardicore 副总裁 Amit Serper 还披露了一种名为“The ol” switcheroo 的攻击，包括向客户端发送请求以降级到较弱的身份验证方案(即HTTP 基本身份验证)，而不是像 OAuth 或 NTLM 这样的安全方法，提示电子邮件应用程序已明文形式发送域凭据。

虽然它极大地简化了身份验证过程，但基本身份验证还使攻击者在未使用传输层安全 (TLS) 加密协议保护连接时更容易窃取凭据。更糟糕的是，在使用基本身份验证时启用多因素身份验证 (MFA) 并不容易;因此，通常它根本不被使用。

现代身份验证(Active Directory 身份验证库 (ADAL) 和基于 OAuth 2.0 令牌的身份验证)允许应用程序使用 OAuth 访问的生命周期是有限的，并且不能重复用于为其提供的资源之外的其他资源进行身份验证。

开启现代身份验证后，启用和强制执行 MFA 将变得更加简单，直接快速是提高 Exchange Online 中的数据安全性。

#### 参考资料
- https://techcommunity.microsoft.com/t5/exchange-team-blog/basic-authentication-deprecation-in-exchange-online-september/ba-p/3609437

⌥E