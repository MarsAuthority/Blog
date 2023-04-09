---
title: Security.News@202206
tags:
  - 安全通讯 Security.News
  - 行业动态
  - 安全事件
  - 行业报告
  - TTPs动态
  - 学习资源
  - Mandiant
  - RSAC
  - 创新沙盒
  - 钓鱼
  - ICMP隧道
  - 风险评估
  - Google
  - Bypass
  - CSP
  - AMD
  - TTPs
  - 学习资源
---

## 安全事件
### LockBit 勒索软件的团伙声称已经入侵了网络安全公司 Mandiant，该公司正在调查所谓的安全事件

本月早些时候，Mandiant 公司发布了一份报告，称网络犯罪团伙“邪恶公司”(Evil Corp) 转用 LockBit 2.0勒索软件来逃避制裁；之后，LockBit 勒索软件团伙将网络安全公司 Mandiant 列入其黑网泄露网站公布的受害者名单。Mandiant 正在调查勒索软件团伙的说法，这个网络犯罪团伙宣称从该公司盗取了356841文件，并计划在网上泄露这些文件。

Mandiant 公司迅速回应了记者的置评请求，并发表声明称: “ Mandiant 公司知道这些与 lockbit 相关的声明。在这一点上，我们没有任何证据支持他们的说法。我们将继续密切关注事态发展。”

![JLtatI](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/JLtatI.jpg)

#### 一些感悟
> 等待更多细节披露，持续跟进中

#### 参考资料
- https://financialpost.com/technology/lockbit-claims-mandiant-data-will-be-published-mandiant-says-no-evidence-of-theft

### 一个网络罪犯团队在4个月内偷走了100万 Facebook 账户凭证

2021年底，防网络钓鱼公司 Pixm 的安全研究人员发现，这项钓鱼攻击事件从去年Q4才开始，但已经证明非常成功。在 Pixm 发现的大约400个登陆页面中，仅仅一个在2021年就有270万的访问量，并且在2022年已经骗取了850万的访问量。

Pixm 确定了大约400个独特的钓鱼页面; 对其中17个页面的随机分析显示，平均浏览量为985,228页。推算到400页，你会得到399,017,673次访问。“我们估计，迄今为止确定的400个用户名，以及他们所有独特的钓鱼网页，只代表了这个活动的一小部分,”Pixm 说。

#### 一些感悟
> 攻击者使用合法的站点托管网站（例如 glitch.me、 Famous.co、amaze.co、funnel-preview.com 等）来绕过Facebook的检测，通过Facebook Messager传播，这种模式对于基于URL信誉度的传统解决方案是毁灭性打击的，而基于内容的检测可能是因为成本过大而无法大规模应用。这种模式的攻击已经非常成熟了，历史上经典的案例包括：Github Page、Google Translate、Azure Blob 存储、Amazon Cloudfront等。

#### 参考资料
- https://pixmsecurity.com/blog/blog/phishing-tactics-how-a-threat-actor-stole-1m-credentials-in-4-months/
- https://www.theregister.com/2022/06/09/facebook_phishing_campaign/
- https://www.proofpoint.com/us/threat-insight/post/threat-actors-abuse-github-service-host-variety-phishing-kits

### AMD服务的450GB数据被窃取

勒索集团 RansomHouse 声称，AMD 员工使用的“123456”等简单密码使窃取数据变得容易。

根据 [TechCrunch](https://techcrunch.com/2022/06/28/amd-extortion-ransomhouse/) 的报道，他们已经看到了一些被盗的数据，RansomHouse不是在开玩笑，密码很简单。AMD 的员工显然是依靠密码，如“password”，“123456”和“Welcome1”来保护他们的帐户。我们都知道这不是个好主意。

#### 一些感悟
> 弱口令是老生常谈的话题了，没想到2022年了，AMD居然还在使用这些密码。
>
> 简单统计了下RansomHouse公开的数据，共xx条记录，其中password 89条，P@ssw0rd 72条，Amd!23 31条，Welcome1 21条，p@ssw0rd1 9条。
>
> 有意思的是，键盘漫游模式的密码也出现了好几次，具体可以看这里 https://twitter.com/PyroTek3/status/1473036483661553669

#### 参考资料
- https://techcrunch.com/2022/06/28/amd-extortion-ransomhouse/

## 行业动态
### 以色列网络安全创业公司 Talon 在 RSA 大会上被评为“最具创新力”

RSA 公司周二宣布，信息安全事件 RSA 会议已经将以色列的 Talon Cybersecurity 评为年度 RSAC 创新沙盒大赛的获胜者。

Talon 被评为“最具创新性的初创企业”，由一组评委选出，创造了业内第一个安全的企业浏览器，使企业能够简化其安全程序，同时提供安全和改进的混合工作体验。

#### 一些感悟
> 云上安全一般可以分为两类：保护企业云上自有业务，以及保护员工安全的访问云上业务。考虑到国外企业大量使用Web服务或SaaS服务，各类业务事实上就是Web服务或SaaS形态，所以后者的场景可以泛化为保护员工访问各类外部服务。
>
> 从Talon的白皮书可以看出，它已经将自己定位成一款Web应用和SaaS的网关类产品，同时提供了运行时隔离、零信任、数据防泄露等能力。
>
> 浏览器可以是天然的零信任agent。

#### 参考资料
- https://talon-sec.com/resources/whitepapers/white-paper-an-enterprise-browser-for-the-digital-business/
- http://blog.nsfocus.net/rsa2022-talon-cyber-security-win/

### 美国 HHS 安全风险评估工具发布3.3版本

美国卫生与公众服务部(HHS)民权办公室(OCR)和国家卫生信息技术协调员(ONC)发布了安全风险评估(SRA)工具3.3版。SRA“旨在帮助医疗保健提供者按照 HIPAA 安全规则和医疗保险和医疗补助服务中心(CMS)电子健康记录(EHR)激励计划的要求进行安全风险评估。”

#### 一些感悟
> 民权办公室 (OCR) 和国家卫生信息技术协调员办公室 (ONC)开发了 SRA 工具，以帮助 HIPAA 涵盖的实体根据HIPAA 安全规则导航风险评估要求。
>
> SRA 工具的受众主要包括中小型供应商，可能不适用于较大的组织；内容主要为政策和合规为主，做起来比实际的安全防御/控制能力建设要简单许多。

#### 参考资料
- https://healthitsecurity.com/news/onc-ocr-release-updated-version-of-hhs-security-risk-assessment-sra-tool
- https://www.healthit.gov/topic/privacy-security-and-hipaa/security-risk-assessment-tool

## 行业报告
### 黑客组织Gallium使用新的难以检测的远程访问木马

Unit 42最近发现了一种新的、难以检测的远程访问木马程序，名为 PingPull，正在被一个叫做进阶持续性渗透攻击(APT)的组织 GALLIUM 使用。

PingPull 具有利用三种协议(ICMP、 HTTP (S)和原始 TCP)进行命令和控制(C2)的能力。尽管使用 ICMP 隧道并不是一种新技术，PingPull 使用 ICMP 使得检测其 C2通信变得更加困难，因为很少有组织在其网络上实现对 ICMP 流量的检查。

#### 一些感悟
> 之前就有人使用ICMP/DNS隧道来免费上网，就是利用运营商/网管无法对这些协议进行计费认证，且难以禁止使用的空子来实现的。作为防守方，我们不光要监控常用的TCP/UDP，更应该对ICMP/DNS的使用额外关注，这里往往会成为检测盲点。

#### 参考资料
- https://unit42.paloaltonetworks.com/pingpull-gallium/
- https://zgao.top/%E5%88%A9%E7%94%A8ptunnel%E5%BB%BA%E7%AB%8Bicmp%E9%9A%A7%E9%81%93%E5%AE%9E%E7%8E%B0%E8%81%94%E9%80%9A%E6%A0%A1%E5%9B%AD%E7%BD%91%E5%85%8D%E6%B5%81/

## TTPs动态
### 使用悬挂 iframe 绕过 CSP

CSP 将about:blank URL 视为同源（同源策略），当攻击者将跨域 iframe 设置为 about:blank 时，它就变得可以被攻击者读取；虽然Chrome之前针对****Dangling markup injection****的缓解措施有一定的用处，但通过滥用浏览器特性，可以绕过这些缓解措施，并通过注入获得跨域信息——即使在你的 CSP 中禁用了 JavaScript。

#### 一些感悟
> portswigger真的是把web安全玩透了，一直可以从他们这里学到各种新姿势、新思路。

#### 参考资料
- https://portswigger.net/research/bypassing-csp-with-dangling-iframes

## 学习资源
## Google chronicle提供的一些学习资源

探索 Chronicle 资源，包括白皮书、网络研讨会、案例研究和数据表。

#### 一些感悟
> 值得仔细看看，竞品分析必备良器。

#### 参考资料
- https://chronicle.security/knowledge-base/

⌥E