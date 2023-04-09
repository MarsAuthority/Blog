---
title: Security.News@202205
tags:
  - 安全通讯 Security.News
  - 供应链安全
  - 行业动态
  - 安全事件
  - 行业报告
  - 学习资源
  - Google
  - 阿里云
  - 蜜罐
  - SOAR
  - 雾帜智能
  - Twitter
  - NSA
  - 最佳实践
  - 数据泄露
  - 钓鱼
---

## 供应链/开源软件安全

### **开源安全基金会和 Linux 基金会呼吁1.5亿美元来改善开源安全**

亚马逊、爱立信、谷歌、英特尔、微软和 VMWare 已经承诺提供3000万美元。更多资金已经在路上了，亚马逊AWS已经承诺额外提供1000万美元。

以下是开源行业致力于实现的十个目标。
    1. 安全教育: 向所有人提供基线安全软件开发教育和认证。
    2. 风险评估: 为前10,000(或更多) OSS 组件建立一个公开的、供应商中立的、基于客观度量的风险评估仪表板。
    3. 数字签名: 加快采用软件版本的数字签名。
    4. 内存安全: 通过替换非内存安全语言来消除许多漏洞的根本原因。
    5. 事件响应: 建立 OpenSSF 开源安全事件响应小组，安全专家可以在关键时刻协助开源项目响应漏洞。
    6. 更好的扫描: 通过先进的安全工具和专家指导，加速维护人员和专家发现新的漏洞。
    7. 代码审计: 每年对多达200个最关键的开放源码软件组件进行一次第三方代码审查(以及任何必要的补救工作)。
    8. 数据共享: 协调整个行业的数据共享，以改进有助于确定最关键 OSS 组件的研究。
    9. 软件物料清单(SBOMs) : 到处改进 SBOM 的工具和培训，以推动采用。
    10. 改进的供应链: 通过更好的供应链安全工具和最佳实践，加强10个最关键的供应链/开源软件构建系统、包管理器和分销系统。

#### 一些感悟
> 从Strust2、Heartbleed、Solarwinds到Log4j，可以看到供应链/开源软件的漏洞影响是多么深远，现在越来越多的科技巨头加入治理，希望能改善供应链/开源软件这块“金三角”；对应国内类似的相关治理建议，可以参考CNCERT的《2021 年开源软件供应链安全风险研究报告》。

#### 参考资料
- https://www.zdnet.com/article/white-house-joins-openssf-and-the-linux-foundation-in-securing-open-source-software/
- https://www.cert.org.cn/publish/main/upload/File/2021%20Risk%20Analysis%20Report%20of%20Open%20Source%20Software%20%20.pdf

### Google宣布成立“开源维护组”

在这次会议（前面提到的OpenSSF会议）上，Google宣布成立新的“开源维护小组”——一个由Google工程师组成的敬业团队，他们将与上游维护者紧密合作，提高关键开源项目的安全性。除了这一举措，我们还提出了一些想法，并参与了关于提高开放源码软件的安全性和可信度的讨论。

Google提出了一个用于解决开源漏洞的框架：了解，预防，修复；希望在推进和改进软件供应链安全的事业中产生动力。
    1. 了解：我们“了解”的目标是捕获更精确的漏洞数据，建立一个标准模式来跟踪跨数据库的漏洞，并创建工具来更好地跟踪依赖关系。
        在 Log4j 漏洞响应期间，google 支持的 [Open Source Insights](https://deps.dev/) 项目帮助社区[了解漏洞的影响](https://security.googleblog.com/2021/12/understanding-impact-of-apache-log4j.html)。
    2. 预防：为了帮助用户了解新依赖项的风险，以便他们能够对所使用的包和组件做出明智的决策。
        我们已经看到社区在预防漏洞方面的强有力的参与，尤其是在安全记分卡项目中。[Scorecards](https://securityscorecards.dev/) 评估项目遵守安全最佳实践的情况，并为开发人员在使用依赖项之前可以参考的评分进行分配。
    3. 修复：为了帮助用户理解他们的选择，以消除漏洞，使通知能够帮助加速修复，并修复受影响软件的广泛使用的版本，而不仅仅是最新的版本。
        Google去年为开源项目提供了1500万美元。这包括750万美元，用于供应链安全、模糊、内核安全和关键基础设施安全等领域的定向安全工作。

#### 一些感悟
> 谷歌是开源的最大商业用户之一，如果没有开源软件，Google的大部分服务都不会存在。
>
> 其实整个互联网行业都是开源软件的最大受益者，但它们已经白嫖习惯了……

#### 参考资料
- https://blog.google/technology/safety-security/shared-success-in-building-a-safer-open-source-community/

## 行业动态

### 阿里云云原生蜜罐重磅发布
HoneyPot技术由来已久，通过诱饵资产与用户真实资产混合部署，提升内网感

知力、并增加攻击复杂度，是打破攻防不对等的重要手段。

但是，传统蜜罐欺骗防御方案往往因为成本、真实度等问题不能实现高覆盖，形成“不可能三角〞。

![阿里云云原生蜜罐](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/dYd6gT.jpg)
    
云蜜罐使用四大技法，打破不可能：
1. VPC黑洞探针
2. 主流应用类型全覆盖
3. 伪装程度随心配置
4. 联动防御与溯源反制

#### 一些感悟
> 云原生蜜罐的优势在于微服务架构的高灵活性和可维护性，利用云平台设施实现快速部署和弹性伸缩；AWS Marketplace上已经有了很多支持云原生的蜜罐产品。

#### 参考资料
- https://developer.aliyun.com/article/927892
- https://aws.amazon.com/marketplace/search?searchTerms=honeypot

### 雾帜智能发布《国内SOAR领域首个Top 10安全剧本最佳实践》
我们邀请过去3年中部分已经部署或即将部署雾帜SOAR（HoneyGuide）的客户进行了一对一的访谈。在本次访谈中，我们一共收集了将近400个在用剧本。我们的专家团队对这400个剧本和我们已有的剧本仓库中的100多个剧本模板，总计约500个剧本进行了统计、分析和评估。最终，我们从中整理了10个被认为通用且最有价值的优秀剧本，借本次产品发布会的机会分享给大家。这些剧本涵盖事件响应、漏洞管理和应急预案等多个方面，希望能抛砖引玉，与大家探讨SOAR剧本的最佳实践。

剧本列表

[剧本列表](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/RETRHL.jpg)

#### 一些感悟
> 看到SOAR平台，我的第一反应就是低代码平台，如Node-RED，但根据Gartner对SOAR最新的定义，强调了SOAR是一种为人提供机器协助的解决方案，重点在人与流程（People and Process），而不是单纯的编排与自动化工具；或许可以称之为SOA for human。

#### 参考资料
- https://www.secrss.com/articles/24043

### 美国国家安全局和其盟友发布网络安全建议
CISA 在 NSA 和其他合作伙伴的帮助下制定了该建议。 其中包括 FBI、加拿大网络安全中心 (CCCS)、新西兰国家网络安全中心 (NCSC-NZ) 和计算机应急响应小组 (CERT NZ)、荷兰国家网络安全中心 (NCSC-NL)，以及 英国国家网络安全中心（NCSC-UK）就该咨询。 许多相同的网络安全机构在 4 月 27 日合作发布了补充公告，其中强调了自 2021 年以来最常被利用的漏洞。

NSA推荐的七大安全最佳实践
    - 访问控制
    - 加固凭据
    - 日志集中管理
    - 使用防病毒软件
    - 部署检测工具
    - 使用安全配置操作在可访问 Internet 的主机上公开的服务
    - 保持软件更新

#### 一些感悟
> 里面大多数建议都可以在CIS Critical Controls中看到，相当于一个MVP（最小可用产品）。
>
> 引用赵彦在《从Google白皮书看企业安全最佳实践》中提到的一句话：没有业界安全大会上那些花俏的概念和名词，全都是正统的安全设计思路，以既有的简单的安全手段解决复杂的问题。

#### 参考资料
- https://media.defense.gov/2022/May/17/2002998718/-1/-1/0/CSA_WEAK_SECURITY_CONTROLS_PRACTICES_EXPLOITED_FOR_INITIAL_ACCESS.PDF
- https://www.cisecurity.org/controls

## 学习资源
### SentinelOne 推荐2022年要关注的22个安全类Twitter账号

信息安全在于知识分享，在 Twitter 上你会发现我们这个行业最优秀最聪明的人就是这么做的。那么，在2022年，你应该跟随谁来关注时事，扩展你的知识，学习新的技能和资源呢？我们精心挑选了22个重要的网络安全账户，虽然你可以在我们前几年的[Twitter名单](https://www.google.com/search?q=site%3Ahttp%3A%2F%2Fsentinelone.com++twitter+accounts+following&ie=UTF-8&oe=UTF-8)中找到一些推荐，但今年的名单上也有许多新的、有趣的、有影响力的推特用户。让我们来看看吧！

- 名单
  - [@KimZetter](https://twitter.com/KimZetter)
  - [@maddiestone](https://twitter.com/maddiestone)
  - [@cyb3rops](https://twitter.com/cyb3rops)
  - [@campuscodi](https://twitter.com/campuscodi)
  - [@cglyer](https://twitter.com/cglyer)
  - [@billyleonard](https://twitter.com/billyleonard)
  - [@Kostastsale](https://twitter.com/Kostastsale)
  - [@vxunderground](https://twitter.com/vxunderground)
  - [@likethecoins](https://twitter.com/likethecoins)
  - [@RidT](https://twitter.com/RidT)
  - [@theJoshMeister](https://twitter.com/theJoshMeister)
  - [@ryanaraine](https://twitter.com/ryanaraine)
  - [@craiu](https://twitter.com/craiu)
  - [@AricToler](https://twitter.com/AricToler)
  - [@evacide](https://twitter.com/evacide)
  - [@4n6lady](https://twitter.com/4n6lady)
  - [@zackwhittaker](https://twitter.com/zackwhittaker)
  - [@trufae](https://twitter.com/trufae)
  - [@Fox0x01](https://twitter.com/Fox0x01)
  - [@HostileSpectrum](https://twitter.com/HostileSpectrum)
  - [@GossiTheDog](https://twitter.com/GossiTheDog)
  - [@juanandres_gs](https://twitter.com/juanandres_gs)

#### 一些感悟
> 好好学习，天天向上；另外推荐两个可以Follow的Twitter List：Offense and Infosec Under 2.5k 。

#### 参考资料
- https://www.sentinelone.com/blog/22-cybersecurity-twitter-accounts-you-should-follow-in-2022/

## 安全事件
### 中国互联网公司搜狐的员工被电子邮件欺诈欺骗，承诺给那些提供他们银行数据的人“津贴”

中国互联网门户网站搜狐网周三表示，20多名员工在一起电子邮件诈骗案中损失超过4万元人民币(合6000美元) ，该诈骗案承诺向提供银行账户和其他个人身份信息的受益人提供“津贴”。

奇安信、中睿天下和微步在线等厂商均对这一件事件发布了分析报告，完整的攻击过程大致为：

1. 通过网络攻击手段获取到目标邮件服务器高级权限账号
2. 以财务部、税务局、人力资源和社会保障服务平台及国家社会保险公共服务等部门名义下发的《关于发布2022最新补贴通知》邮件
3. 该封邮件正文中放置了一张二维码图片，诱导收件人扫描正文中二维码。邮件附件的内容和邮件正文一样，并未携带病毒和可执行文件。（该组织利用 DGA 域名生成技术，生成了大量用于做为跳板的 DGA 域名，将其制成二维码。受害者通过手机扫描二维码来解析到对应的钓鱼页面）
4. 通过快捷支付进行盗刷，购买虚拟商品进行分销变现

#### 一些感悟
> 2021年12月，中国信通院发布的报告称，钓鱼邮件的发件者会模仿成信誉良好的组织或机构，其目标通常是窃取身份验证数据等敏感信息、安装恶意软件或获取信用卡号等其他财务资源。一部分钓鱼攻击属于鱼叉式网络钓鱼，具有高度针对性，但是无确定攻击对象的“广撒网”式钓鱼攻击活动更为普遍。未来较长一段时间内，网络钓鱼攻击将变得越来越常见，并可能和勒索软件、APT攻击等手段相结合，诱饵和所用邮箱也将和企业机构信息有更高的相关度。安全人员可适当开展网络安全培训、网络钓鱼模拟演练等工作，定期督促员工警惕钓鱼攻击的风险和危害，提升员工网络安全意识，防止被网络钓鱼。

#### 知识扩展

1. Google的这个防钓鱼测试挺有意思，用来做安全意识培训比干巴巴的文字体验好太多，[https://phishingquiz.withgoogle.com](https://phishingquiz.withgoogle.com/)
2. Microsoft的钓鱼模拟训练，[https://docs.microsoft.com/zh-cn/microsoft-365/security/office-365-security/attack-simulation-training](https://docs.microsoft.com/zh-cn/microsoft-365/security/office-365-security/attack-simulation-training?view=o365-worldwide)

#### 参考资料
- https://mp.weixin.qq.com/s/qGbwJJ5oGn4tdnFadq0c8g
- https://mp.weixin.qq.com/s/-WjOYPWIEGAUenLsQs7D7w
- https://mp.weixin.qq.com/s/uEiJIFzCqVuFsPzONu7v_A
- https://support.microsoft.com/zh-cn/windows/%E9%98%B2%E8%8C%83%E7%BD%91%E7%BB%9C%E9%92%93%E9%B1%BC-0c7ea947-ba98-3bd9-7184-430e1f860a44

## 行业报告

### Verizon Business 发布了2022年数据泄露调查报告
主要发现包括: 
1. 勒索软件攻击事件同比增加了13% ，比过去5年的总和还要多
2. 大约五分之四的违规行为可归因于有组织犯罪，外部行为者在一个组织中造成违规行为的可能性大约是内部行为者的4倍
3. 在过去的一年中，82% 的数据泄露都与人为因素有关

#### 一些感悟
> 正如Lapsus$靠买通内部人员拿下一家又一家的知名公司一样，人为因素一直是导致网络安全事件的主要原因，安全不光是技术对抗，更多的是人之间的对抗；而在现代企业的网络安全防御体系中，人也是最不受重视的环节，大家衷于采购最先进的网络安全技术和方案，并试图提高安全工具集成度和自动化水平，却在员工安全意识上投入不足。人员漏洞是最危险也最容易修复的漏洞（不需要昂贵的技术产品和顶尖技术人才），同时也是最难修复的漏洞（不被重视、缺乏预算）。
>
> RSAC 2020的主题是：“人是安全要素”，RSAC在发布本次大会主题时宣称，网络安全不断发展，我们不断提出旨在阻止威胁的新策略和新方法。人工智能和机器学习等新技术比以往任何时候都更有效率地与不良行为者作战。高级恶意工具的日益普及、成本更低，使网络犯罪更加平民化。“人是安全的关键要素”这一基本认识似乎已被遗忘。但无论是安全防护还是攻击背后的恒久力量一直都是人。即便进入安全自动化时代，我们应对网络攻击的最宝贵的武器将永远是自己。因此，进入21世纪的第三个十年，RSAC2020成为提醒业界记起“人是安全要素”这一基本认识的好时机。
>
> 知名黑客Kevin Mitnick在15年前曾写道：人，而非技术，才是安全最弱的一环。在其畅销书《欺骗的艺术：控制安全中人的要素》，Kevin Mitnick证实了，即便没有高级的黑客技术，社工手段依然可以导致大规模数据泄露。

#### 参考资料
- https://www.verizon.com/business/resources/reports/2022/dbir/2022-data-breach-investigations-report-dbir.pdf