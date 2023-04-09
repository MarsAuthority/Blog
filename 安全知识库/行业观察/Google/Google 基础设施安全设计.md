---
title: Google 基础设施安全设计
tags:
- 行业观察
- Google
- 系统设计
---

# 简介

本文档概要介绍了 Google 的技术基础架构如何从设计层面实现原生安全性，这些内容面向安全高管、安全架构师和审核人员。

本文档介绍了以下内容：

- Google 的全球技术基础架构，旨在令 Google 能够在整个信息处理周期中提供安全保障。此基础架构可帮助实现以下目的：
  - 安全地部署服务
  - 通过最终用户的隐私保护措施安全地存储数据
  - 保障服务之间的通信安全
  - 通过互联网安全且私密地与客户交流
  - Google 工程师进行安全运营
- 我们如何使用此基础架构构建互联网服务，包括 Google 搜索、Gmail 和 Google 相册等个人用户服务以及 Google Workspace 和 Google Cloud 等企业服务。
- 我们在确保基础架构和运营安全方面的投资。Google 有许多致力于安全与隐私保护的工程师，其中许多人是公认的业界权威。
- Google 的安全产品和服务，这些产品和服务是为满足我们自身的安全需求在内部进行创新而产生的成果。例如，[BeyondCorp](https://cloud.google.com/beyondcorp?hl=zh-cn) 是我们在内部实现[零信任安全模型](https://cloud.google.com/blog/products/identity-security/cloud-ciso-perspectives-january-2022?hl=zh-cn)的直接成果。
- 如何逐层设计基础架构的安全机制。这些安全层包括：
  - [底层基础架构](https://cloud.google.com/docs/security/infrastructure/design?hl=zh-cn#secure-low-level)
  - [服务部署](https://cloud.google.com/docs/security/infrastructure/design?hl=zh-cn#secure-service)
  - [数据存储](https://cloud.google.com/docs/security/infrastructure/design?hl=zh-cn#secure-data)
  - [互联网通信](https://cloud.google.com/docs/security/infrastructure/design?hl=zh-cn#secure-internet)
  - [运维](https://cloud.google.com/docs/security/infrastructure/design?hl=zh-cn#operational-security)

本文档的后续部分将介绍这些安全层。

# 安全的底层基础架构

本部分介绍如何保护数据中心的实体场所、数据中心的硬件以及硬件上运行的软件栈。

## 实体场所的安全性

我们设计和建造了自己的数据中心，其中加入了多层物理安全保护措施。对这些数据中心的访问受到严格控制。我们使用多个物理安全层来保护数据中心场地，包括生物识别、金属检测、摄像头、车辆栏障和激光入侵检测系统。如需了解详情，请参阅[数据中心安全性](https://www.google.com/about/datacenters/data-security/?hl=zh-cn)。

我们还在第三方数据中心托管了一些服务器。在这些数据中心里，除了数据中心运营商提供的安全层之外，我们还确保落实由 Google 管控的物理安全措施。例如，我们运行独立于数据中心运营商安全层的生物识别系统、摄像头和金属探测器。

## 硬件的设计和来源

Google 的每个数据中心都有数千台服务器与本地网络相连。我们设计服务器主板和网络设备，对合作的组件供应商进行审核，并谨慎选择组件。我们与供应商合作，对组件提供的安全属性进行审核和验证。我们还设计专门的芯片，包括我们在服务器、设备和外围设备上部署的硬件安全芯片（称为 [Titan](https://cloud.google.com/blog/products/identity-security/titan-in-depth-security-in-plaintext?hl=zh-cn)）。这些芯片可使我们在硬件级别对正规的 Google 设备进行识别和身份验证，并充当硬件信任根。

**注意**：Titan 硬件芯片的变体也用于 [Pixel 设备](https://safety.google/pixel/?hl=zh-cn#security-by-design)和 [Titan 安全密钥](https://cloud.google.com/titan-security-key?hl=zh-cn)。

## 安全启动栈和机器身份标识

Google 服务器利用各种技术来确保启动正确的软件栈。我们对基板管理控制器 (BMC)、BIOS、引导加载程序、内核和基础操作系统映像等底层组件使用加密签名。可以在每次启动或更新期间对这些签名进行验证。Google 服务器的第一个完整性检查使用硬件信任根。这些组件由 Google 控制和构建，并通过完整性证明进行强化。对于每一代新硬件，我们都致力于不断提高安全性。例如，根据服务器设计的代次，启动链的信任根在以下某个组件中：

- Titan 硬件芯片
- 可锁定的固件芯片
- 运行我们自己的安全代码的微控制器

数据中心的每个服务器都有唯一的身份标识。可以将这一身份标识与硬件信任根以及机器启动所用的软件相关联。此身份标识用于对机器上的底层管理服务之间的 API 调用进行身份验证。此身份标识也用于双向服务器身份验证和传输加密。我们开发了[应用层传输安全 (ALTS)](https://cloud.google.com/docs/security/encryption-in-transit/application-layer-transport-security?hl=zh-cn) 系统，用于保护基础架构中的远程过程调用 (RPC) 通信的安全。如果发生安全突发事件，可以集中撤消这些机器身份标识。此外，它们的证书和密钥会定期轮替，旧的证书和密钥会被撤消。

我们开发了自动化系统来执行以下任务：

- 确保服务器运行其软件栈的最新版本（包括安全补丁）。
- 检测和诊断硬件和软件问题。
- 使用启动时验证和隐式证明确保机器和外围设备的完整性。
- 确保只有运行指定软件和固件的机器才能访问使其可在生产网络中进行通信的凭据。
- 当不再需要机器时，在服务中移除或重新分配机器。

# 安全的服务部署

Google 服务是由我们的开发者编写并在我们的基础架构上运行的应用二进制文件。Google 服务的示例包括 Gmail 服务器、Spanner 数据库、Cloud Storage 服务器、YouTube 视频转码器和运行客户应用的 Compute Engine 虚拟机。为了处理所需规模的工作负载，可能会有数千台机器运行同一服务的二进制文件。集群编排服务（称为 [Borg](https://research.google/pubs/pub43438/?hl=zh-cn)）控制直接在基础架构上运行的服务。

基础架构假定基础架构上运行的服务之间不存在任何信任。此信任模型称为“零信任安全模型”。零信任安全模型意味着在默认情况下不信任任何设备或用户，无论它们是位于网络内部还是外部。

由于基础架构设计为多租户，因此客户的数据（个人用户、企业，甚至我们自己的数据）分布在整个共享基础架构中。此基础架构由数以万计的同构机器组成。除特定情况外（例如，使用 Google Cloud 在[Compute Engine 的单租户节点](https://cloud.google.com/compute/docs/nodes/sole-tenant-nodes?hl=zh-cn)上预配虚拟机），基础架构不会将客户数据隔离到单个机器或一组机器中。

Google Cloud 和 Google Workspace 支持有关数据驻留的监管要求。如需详细了解数据驻留和 Google Cloud，请参阅[实现数据驻留和主权要求](https://cloud.google.com/architecture/framework/security/data-residency-sovereignty?hl=zh-cn)。如需详细了解数据驻留和 Google Workspace，请参阅[数据区域：选择数据的地理位置](https://support.google.com/a/answer/7630496?hl=zh-cn)。

## 服务身份标识、完整性与隔离

为了实现服务间通信，应用使用加密的身份验证和授权。身份验证和授权以管理员和服务可以理解的抽象级别和粒度提供强大的访问权限控制。

服务不依赖内部网络分段或防火墙作为主要安全机制。我们网络中各处的入站流量和出站流量过滤可帮助防止 IP 欺骗。这种方法还有助于我们最大限度地提高网络的性能和可用性。对于 Google Cloud，您可以添加其他安全机制，例如 [VPC Service Controls](https://cloud.google.com/vpc-service-controls/docs/overview?hl=zh-cn) 和 [Cloud Interconnect](https://cloud.google.com/network-connectivity/docs/interconnect/concepts/overview?hl=zh-cn)。

在基础架构上运行的每个服务都具有关联的服务帐号身份标识。服务会获得加密凭据，可用于在发出或接收 RPC 时向其他服务证明其身份。这些身份在安全政策中使用。安全政策可确保客户端与预期服务器通信，并且服务器限制特定客户端可以访问的方法和数据。

我们使用各种隔离和沙盒技术来保护服务免受同一机器上运行的其他服务的影响。这些技术包括 Linux 用户分离、基于语言（如 [Sandboxed API](https://developers.google.com/code-sandboxing/sandboxed-api?hl=zh-cn)）和基于内核的沙盒、容器应用内核（如 [gVisor](https://gvisor.dev/)）和硬件虚拟化。一般来说，我们会为风险较高的工作负载使用更多的隔离层。风险较高的工作负载包括用户提供的需要进行额外处理的内容。例如，风险较高的工作负载包括针对用户提供的数据运行复杂的文件转换器，或者为 App Engine 或 Compute Engine 等产品运行用户提供的代码。

为了提高安全性，敏感服务（例如集群编排服务和某些密钥管理服务）只在专用机器上运行。

在 Google Cloud 中，为了为您的工作负载提供更强的加密隔离以及保护使用中的数据，我们支持 Compute Engine 虚拟机和 Google Kubernetes Engine (GKE) 节点使用[机密计算](https://cloud.google.com/confidential-computing?hl=zh-cn)服务。

## 服务间访问管理

服务的所有者可以利用基础架构提供的访问管理功能来精确指定其服务可以与其他哪些服务进行通信。例如，一个服务可以将传入 RPC 限制为一组允许的其他服务。在这种情况下，可以使用服务身份许可名单配置该服务，基础架构会自动执行此访问限制。执行包括审核日志记录、理由以及单方面访问限制（例如，针对工程师请求）。

需要访问服务的 Google 工程师也会获得个人身份标识。可以将服务配置为根据身份标识允许或拒绝访问。所有这些身份标识（机器、服务和员工）都位于基础架构维护的全局命名空间中。

为管理这些身份标识，基础架构提供了一个工作流系统，其中包括批准链、日志记录和通知。例如，安全政策可以执行多方授权。此系统使用双人规则，确保一个工程师必须先获得另一个授权工程师的批准才能独自执行敏感操作。借助这一系统，可以将安全访问管理流程扩展到基础架构上运行的数千个服务。

基础架构还为服务提供用户、群组和成员资格管理的规范化服务，可以在必要时实现精细的自定义访问权限控制。

如 [Google Workspace 中的最终用户数据访问管理](https://cloud.google.com/docs/security/infrastructure/design?hl=zh-cn#access-management-of-end-user-data-in-google-workspace)中所述，最终用户身份标识是单独管理的。

## 服务间通信的加密

基础架构可确保网络上的 RPC 数据的机密性和完整性。所有 Google Cloud 虚拟网络流量均经过加密。基础架构服务之间的所有通信都经过身份验证，大多数服务间通信均已加密，这增加了一层额外的安全保护，即使网络被窃听或网络设备遭到破解，也能保护通信。服务间通信加密要求的例外情况仅授予延迟要求低的流量，并且这也不会在数据中心的多个物理安全层中留下单个网络结构。

基础架构可自动、高效地（借助硬件分流）为数据中心之间通过网络传输的基础架构 RPC 流量提供端到端加密。

## Google Workspace 中的最终用户数据访问管理

我们编写了一个典型的 Google Workspace 服务来代表最终用户执行某些操作。例如，最终用户可以将电子邮件存储在 Gmail 上。最终用户与 Gmail 等应用的互动可能会涉及到基础架构内的其他服务。例如，Gmail 可能会调用 People API 以访问最终用户的通讯簿。

[服务间通信的加密](https://cloud.google.com/docs/security/infrastructure/design?hl=zh-cn#encryption-inter-service)介绍了如何将某个服务（例如 Google 通讯录）设计为保护来自另一个服务（例如 Gmail）的 RPC 请求。但是，这一访问权限控制级别仍然是一组广泛的权限，因为 Gmail 可以随时请求任何用户的联系人。

当 Gmail 代表最终用户向 Google 通讯录发送 RPC 请求时，基础架构允许 Gmail 在 RPC 请求中提供最终用户权限票证。此票证可证明 Gmail 代表该特定最终用户发出 RPC 请求。Google 通讯录通过票证实现安全保护措施，从而仅返回票证中指定的最终用户的数据。

基础架构提供了一项中央用户身份识别服务，该服务可以颁发上述最终用户权限票证。身份识别服务验证最终用户登录，然后向用户的设备颁发用户凭据，例如 Cookie 或 OAuth 令牌。从该设备发送到我们的基础架构的每个后续请求都必须提供该最终用户凭据。

当某个服务收到最终用户凭据时，会将该凭据传递给身份识别服务进行验证。如果最终用户凭据通过验证，身份识别服务会返回一个短期有效的最终用户权限票证，该票证可用于与该用户的请求相关的 RPC。在我们的示例中，获得最终用户权限票证的服务是 Gmail，Gmail 将票证传递给 Google 通讯录。之后，对于任何级联调用，调用服务都可以将最终用户权限票证作为 RPC 的一部分发送给被调用方。

下图展示了服务 A 和服务 B 的通信方式。基础架构可提供服务身份、自动身份互验、服务间通信加密，并可执行服务所有者定义的访问政策。每项服务都有一个由服务所有者创建的服务配置。对于加密的服务间通信，自动双向身份验证使用调用方和被调用方身份标识。只有在访问规则配置允许的情况下才能进行通信。

![展示服务 A 和服务 B 通信方式的图表。](https://cloud.google.com/static/docs/security/infrastructure/design/resources/google-infrastructure-interservice-comm.svg?hl=zh-cn)

如需了解 Google Cloud 中的访问管理，请参阅 [IAM 概览](https://cloud.google.com/iam/docs/overview?hl=zh-cn)。

# 安全的数据存储

本部分介绍如何保证存储在基础架构上的数据的安全。

## 静态加密

Google 的基础架构提供各种存储服务和分布式文件系统（例如 Spanner 和 [Colossus](https://cloud.google.com/blog/products/storage-data-transfer/a-peek-behind-colossus-googles-file-system?hl=zh-cn)）以及一个中央密钥管理服务。Google 的应用使用存储基础架构访问物理存储。我们使用多层加密来保护静态数据。默认情况下，存储基础架构会在用户数据写入物理存储空间之前加密所有用户数据。

基础架构在应用层或存储基础架构层执行加密。加密可使基础架构将其自身与底层存储上的潜在威胁（例如恶意磁盘固件）隔离开来。在可能的情况下，我们还会在硬盘和固态硬盘中启用硬件加密支持，并在每个硬盘的整个生命周期内细致地进行跟踪。对于退役的加密存储设备，我们先通过多步骤流程（包括两次独立验证）清空其内容，然后才会将其在物理上撤离我们的管控范围。对于未经历此清理过程的设备，我们会在现场进行物理销毁（即粉碎）。

除了基础架构进行的加密以外，Google Cloud 和 Google Workspace 还提供密钥管理服务。对于 Google Cloud，您可以使用 [Cloud KMS](https://cloud.google.com/docs/security/key-management-deep-dive?hl=zh-cn)，它是一种允许客户管理加密密钥的云服务。对于 Google Workspace，您可以使用客户端加密功能。如需了解详情，请参阅 [Google Workspace 中的客户端加密功能和增强型协作工具](https://cloud.google.com/blog/products/workspace/new-google-workspace-security-features?hl=zh-cn)。

## 数据删除

数据删除流程通常是从将具体数据标记为“已安排删除”开始，而不是真正的删除数据。借助此方法，我们可以恢复无意间删除的数据，例如由客户发起的删除、bug 导致的删除或内部流程错误导致的删除。数据标记为“已安排删除”后，系统会根据特定于服务的政策来删除数据。

当最终用户删除其帐号时，基础架构会通知处理最终用户数据的服务该帐号已被删除。然后，这些服务便会安排删除与被删除的最终用户帐号相关联的数据。此功能使最终用户能够控制自己的数据。

如需了解详情，请参阅 [Google Cloud 上的数据删除](https://cloud.google.com/docs/security/deletion?hl=zh-cn)。

# 安全的互联网通信

本部分介绍我们如何保护互联网与 Google 基础架构上运行的服务之间的通信。

如[硬件的设计和来源](https://cloud.google.com/docs/security/infrastructure/design?hl=zh-cn#hardware-design)中所述，基础架构由许多通过 LAN 和 WAN 互连的物理机器组成。服务间通信的安全性不依赖于网络安全。但是，我们将基础架构从互联网隔离到专用 IP 地址空间。我们只会将部分机器直接暴露给外部互联网流量，从而可以实现额外的保护，例如防御拒绝服务 (DoS) 攻击。

## Google Front End 服务

当某个服务需要在互联网上可用时，它可向名为 Google Front End (GFE) 的基础架构服务注册。通过使用正确的证书并遵循最佳实践（例如支持完全正向加密），GFE 可确保终结全部 TLS 连接。GFE 还会应用保护措施来防御 DoS 攻击。然后，GFE 利用 [Google Workspace 中的最终用户数据访问管理](https://cloud.google.com/docs/security/infrastructure/design?hl=zh-cn#access-management-of-end-user-data-in-google-workspace)中讨论的 RPC 安全协议转发对该服务的请求。

实际上，任何必须向外发布的内部服务都使用 GFE 作为智能反向代理前端。GFE 提供其公共 DNS 名称的公共 IP 地址托管、DoS 保护和 TLS 终结。GFE 与其他任何服务一样在基础架构上运行并能够根据入站请求量进行调节。

Google Cloud 上的客户虚拟机不向 GFE 注册，而是向 Cloud Front End 注册，Cloud Front End 是使用 Compute Engine 网络堆栈的特殊 GFE 配置。借助 Cloud Front End，客户虚拟机可以使用其公共或专用 IP 地址直接访问 Google 服务。（只有在启用[专用 Google 访问通道](https://cloud.google.com/vpc/docs/private-google-access?hl=zh-cn)后才能使用专用 IP 地址。）

## DoS 防护

我们的基础架构规模庞大，能够抵御许多 DoS 攻击。为了进一步降低 DoS 对服务的影响，我们设置了多层级 DoS 防护。

当我们的光纤骨干网向我们其中一个数据中心传送外部连接时，该连接会经过多层硬件和软件负载均衡器。这些负载均衡器会将有关入站流量的信息报告给在基础架构上运行的中央 DoS 服务。当中央 DoS 服务检测到 DoS 攻击时，该服务可以配置负载均衡器，以降低或限制与攻击相关的流量。

GFE 实例还会将它们正在接收的请求的相关信息报告给中央 DoS 服务，包括负载均衡器无权访问的应用层信息。然后，中央 DoS 服务便可以配置 GFE 实例，以降低或限制攻击流量。

## 用户身份验证

在 DoS 防护之后，安全通信的下一层防御来自中央身份识别服务。最终用户通过 Google 登录页面与此服务交互。该服务要求提供用户名和密码，还可以根据风险因素要求用户提供其他信息。风险因素示例包括用户过去是否从同一设备或类似位置登录过。在对用户进行身份验证之后，身份识别服务会颁发 Cookie 和 OAuth 令牌等凭据，供后续调用时使用。

用户登录时，他们可以使用第二重身份验证，例如动态密码或防钓鱼安全密钥（例如 [Titan 安全密钥](https://cloud.google.com/titan-security-key?hl=zh-cn)）。Titan 安全密钥是支持 [FIDO Universal 2nd Factor (U2F)](https://en.wikipedia.org/wiki/Universal_2nd_Factor) 的物理令牌。我们与 FIDO Alliance 协作开发 U2F 开放标准。大多数网络平台和浏览器都采用此开放身份验证标准。

# 运营安全

本部分介绍我们如何开发基础架构软件，保护员工的机器及凭据，以及防范来自内部人员和外部攻击者的基础架构威胁。

## 安全的软件开发

除了前面介绍的[源代码控制保护机制和双方审核流程](https://cloud.google.com/docs/security/infrastructure/design?hl=zh-cn#secure-service)之外，我们还使用库来防止开发者引入某些安全 bug。例如，我们拥有可帮助 Web 应用避免 XSS 漏洞的库和框架，我们还使用模糊测试工具、静态分析工具和网络安全扫描工具等自动化工具来自动检测安全 bug。

我们会进行人工安全审核以作为最终检查，审核范围从对较低风险的功能进行快速分类，到对最高风险的功能在设计和实施上进行深入审核。执行这些审核的团队包括网络安全、加密和操作系统安全领域的专家。这些审核可以帮助我们开发新的安全库功能和新的模糊测试工具，从而用于未来的产品。

此外，我们还实施了[漏洞奖励计划](https://www.google.com/about/appsecurity/reward-program/?hl=zh-cn)，对发现并报告我们基础架构或应用中的 bug 的任何人士进行奖励。如需详细了解此计划，包括我们提供的奖励，请查看 [Bug Hunters 关键数据](https://bughunters.google.com/about/key-stats?hl=zh-cn)。

此外，我们还致力于发现我们使用的开源软件的零日漏洞和其他安全问题。我们的 [Project Zero](https://googleprojectzero.blogspot.com/) 团队由 Google 研究人员组成，他们专门研究包括 [Spectre 和 Meltdown](https://googleprojectzero.blogspot.com/search?q=spectre) 在内的零日漏洞。我们是为 Linux KVM Hypervisor 提交最多 CVE 和安全 bug 修复的公司。

## 源代码保护

我们的源代码存储在具有内置源完整性和治理的代码库中，可以在其中审核服务的当前版本和过去版本。基础架构要求服务的二进制文件基于经过审核、登记和测试的特定源代码构建。[Binary Authorization for Borg (BAB)](https://cloud.google.com/docs/security/binary-authorization-for-borg?hl=zh-cn) 是部署服务时进行的内部强制执行检查。BAB 发挥以下作用：

- 确保 Google 上部署的生产软件和配置经过审核和授权，尤其是在代码可以访问用户数据时。
- 确保代码和配置部署满足特定的最低标准。
- 防止内部人员或攻击者恶意修改源代码，并实现从服务回溯到其源代码的取证跟踪。

## 确保员工设备及凭据的安全

我们实施保护措施，使员工的设备和凭据免遭破解。为了帮助员工防范复杂的网上诱骗活动，我们强制使用与 U2F 兼容的安全密钥来取代动态密码双重身份验证。

我们监控员工用于运行基础架构的客户端设备。我们确保设备的操作系统映像具有最新的安全补丁，并且控制员工可以在其设备上安装的应用。我们还利用系统来扫描用户安装的应用、下载项、浏览器扩展程序和网络浏览器内容，以确定它们是否适合企业设备。

连接到企业 LAN 不是我们用于决定授予访问权限的主要机制。我们使用零信任安全性来保护员工对资源的访问。仅当员工使用受管设备并从指定网络和地理位置连接时，应用级别的访问管理控制机制才会向员工公开内部应用。客户端设备基于颁发给具体机器的证书以及关于其配置的断言（例如最新软件）获得信任。如需了解详情，请参阅 [BeyondCorp](https://cloud.google.com/beyondcorp?hl=zh-cn)。

## 降低来自内部人员的风险

我们限制并主动监控拥有基础架构管理员权限的员工的活动。通过持续的努力，我们不再需要针对特定任务授予特别访问权限，而是能够以安全可控的方式自动完成同样的任务。例如，对于某些操作我们要求双方批准，以及我们可以使用有限的 API 在不暴露敏感信息的情况下进行调试。

Google 员工对最终用户信息的访问情况可通过底层基础架构钩子进行记录。我们的安全团队会监控访问模式并调查异常事件。

## 威胁监控

Google 的[威胁分析小组](https://blog.google/threat-analysis-group/?hl=zh-cn)会监控威胁发起者及其策略和技术的演变。这个小组的目标是提高 Google 产品的安全性，并向在线社区共享这些情报。

对于 Google Cloud，您可以使用 [Google Cloud Threat Intelligence for Chronicle](https://chronicle.security/products/uppercase/) 和 [VirusTotal](https://support.virustotal.com/hc/en-us/categories/360000162878-Documentation) 来监控和应对多种类型的恶意软件。Google Cloud Threat Intelligence for Chronicle 是一个威胁研究团队，研究人员开发用于 [Chronicle](https://cloud.google.com/chronicle/docs/overview?hl=zh-cn) 的威胁情报。VirusTotal 是一个恶意软件数据库和可视化解决方案，您可以通过它更好地了解恶意软件在您企业中的运行方式。

如需详细了解我们的威胁监控活动，请参阅[威胁情报报告](https://cloud.google.com/blog/products/identity-security/coin-mining-ransomware-apts-target-cloud-gcat-report?hl=zh-cn)。

## 入侵检测

我们使用复杂的数据处理流水线来集成各个设备上基于主机的信号、来自基础架构中各个监控点的基于网络的信号，以及来自基础架构服务的信号。构建于这些流水线之上的规则和机器智能会向运营安全工程师发出潜在突发事件警告。[我们的调查和突发事件响应团队](https://cloud.google.com/docs/security/incident-response?hl=zh-cn)会一年 365 天、一天 24 小时全天候地对这些潜在突发事件进行分类、调查和响应。我们效仿 [Red Team](https://en.wikipedia.org/wiki/Red_team) 的做法来衡量和改善我们的检测与响应机制的有效性。

# 后续步骤

- 如需详细了解我们如何保护我们的基础架构，请参阅[《构建安全可靠的系统》（O'Reilly 书籍）](https://www.oreilly.com/library/view/building-secure-and/9781492083115/)。
- 详细了解[数据中心安全性](https://www.google.com/about/datacenters/data-security/?hl=zh-cn)。
- 详细了解我们如何防范 [DDoS 攻击](https://cloud.google.com/blog/products/identity-security/identifying-and-protecting-against-the-largest-ddos-attacks?hl=zh-cn)。
- 了解我们的零信任解决方案 [BeyondCorp](https://cloud.google.com/beyondcorp?hl=zh-cn)。

# 参考资料
- [https://cloud.google.com/docs/security/infrastructure/design](https://cloud.google.com/docs/security/infrastructure/design)