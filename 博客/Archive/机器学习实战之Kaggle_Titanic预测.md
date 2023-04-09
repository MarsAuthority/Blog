---
title: 机器学习实战之Kaggle_Titanic预测
tags:
- 博客
- 机器学习
---

## 介绍

如果你没有听过Kaggle，那你一定要来了解一下它：

> Kaggle 为全球顶尖数据科学家举办竞赛活动。那些有着科学难题的公司（比如 NASA）可以通过网络将数据和问题提交给 Kaggle，任何顶尖科学家都可以提交问题解决方案，网站会通过对每位科学家的贡献进行排名。到目前为止，在一场竞赛中至少有 30000 人提交至少一种模型。

简单来说就是一个数据科学竞赛网站，非常有趣。接下来让我们一起学习机器学习吧。

这次的任务是：[Titanic-Kaggle](https://www.kaggle.com/c/titanic)

我们的重点是学习机器学习的过程，所以这次不涉及具体的算法实现，而是使用第三方库来实现算法，这里推荐[scikit-learn](http://scikit-learn.org/stable/)，它提供了许多工具和模型，使用起来非常方便。另外我们还是用了[Pandas](https://pandas.pydata.org/)库( `pandas 是基于 Numpy 构建的含有更高级数据结构和工具的数据分析包` )来提高效率，还有`matplotlib` 和 `Seaborn` ，通过图标直观的观察数据。

我们先写一段代码来看看原始数据吧。

```python
import pandas as pd

input_df = pd.read_csv('data/raw/train.csv', header=0)
submit_df  = pd.read_csv('data/raw/test.csv',  header=0)

# 合并他们
df = pd.concat([input_df, submit_df])

# 重建index
df.reset_index(inplace=True)

# 删除reset_index()产生的index column
df.drop('index', axis=1, inplace=True)

print df.shape[1], "columns:", df.columns.values
print "Row count:", df.shape[0]
```

-   我们把training data 和 test data合并到了一起，因为在提取特征的时候，需要获取value的范围和分布。所以需要将他们合在一起处理。
-   Pandas合并data sets非常灵活，不会影响合并之前的原始数据，使用方便。

输出如下，共有1309条数据，12个feature：

```python
12 columns: ['PassengerId' 'Survived' 'Pclass' 'Name' 'Sex' 'Age' 'SibSp' 'Parch'
 'Ticket' 'Fare' 'Cabin' 'Embarked']
Row count: 1309
```

## 数据预处理

拿到数据第一步是观察一下数据，看看是否有缺失数据，分析一下相关特征等等。

```python
def observe(df):
	print "column: ", df.shape[1]
	columns = df.columns
	for i in columns:
		print i, "missing ",pd.isnull(df[i]).sum(), " type:", df[i].dtypes

---
column:  12
Age missing  263  type: float64
Cabin missing  1014  type: object
Embarked missing  2  type: object
Fare missing  1  type: float64
Name missing  0  type: object
Parch missing  0  type: int64
PassengerId missing  0  type: int64
Pclass missing  0  type: int64
Sex missing  0  type: object
SibSp missing  0  type: int64
Survived missing  418  type: float64
Ticket missing  0  type: object
```

可以看到：

1.  Survived 的缺失可以忽略，因为`test.csv`中的数据本来就是没有Survived的。
2.  Cabin 缺失很严重，我想可以忽略这一个特征了。
3.  Age 缺失的并不多，而且Age是一个重要的特征，应该保留。

再看看数据的内容吧：

```python
print df.head()

---
Age Cabin Embarked     Fare  \\
0   22   NaN        S   7.2500   
1   38   C85        C  71.2833   
2   26   NaN        S   7.9250   
3   35  C123        S  53.1000   
4   35   NaN        S   8.0500   

                                                Name  Parch  PassengerId  \\
0                            Braund, Mr. Owen Harris      0            1   
1  Cumings, Mrs. John Bradley (Florence Briggs Th...      0            2   
2                             Heikkinen, Miss. Laina      0            3   
3       Futrelle, Mrs. Jacques Heath (Lily May Peel)      0            4   
4                           Allen, Mr. William Henry      0            5   

   Pclass     Sex  SibSp  Survived            Ticket  
0       3    male      1         0         A/5 21171  
1       1  female      1         1          PC 17599  
2       3  female      0         1  STON/O2. 3101282  
3       1  female      1         1            113803  
4       3    male      0         0            373450
```

先看看每个特征的含义：

-   Age （年龄）
-   Cabin（客舱位置）
-   Embarked（港口编号）
-   Fare（票价）
-   Name（姓名）
-   Parch（父母/孩子的数量）
-   PassengerId
-   Pclass（客舱等级）
-   Sex（性别）
-   SibSp（配偶的数量）
-   Survived(存活与否)
-   Ticket（船票编号）

直观的看，`PassengerId`，`Ticket`没什么用，先忽略他们。

## 处理缺失数据

在数据中出现缺失或者错误的Value是很正常的事，一些预测模型可以很好的处理缺失数据 `如神经网络(neural networks)`，有些则需要单独处理他们。我们使用随机森林(Random Forest)来做预测模型，它自身并不能对付缺失数据，所以需要单独进行处理。有两种方法：

1.  直接扔掉出现缺失Value的数据：只有少量的数据出现缺失Value的情况，这样做比较简单快捷。
2.  给缺失的Value赋特殊值来表明它是缺失的：比较适用于分类变量，因为缺失Value就是不存在的数据，如果给他分配平均值之类的数值并没有什么意义。除非是某些潜在原因使某些缺失值会影响其与另外一个值的关联(correlation)。并且这种方法不适用于连续变量。不过对于二元变量(binary variables)，我们可以把他的缺失值赋为0，正常情况下True为1，False为-1。

```python
df['Cabin'][df.Cabin.isnull()] = 'U0'
```

1.  给缺失的Value赋平均值：这种简单的做法很普遍，对于不重要的特征来说用这种方法足矣。还可以结合其他变量来算平均值。对于分类变量，使用最常见的值或许比平均值更好。

```python
平均值：
df['Fare'][ np.isnan(df['Fare']) ] = df['Fare'].median()
最常见的值：
df.Embarked[ df.Embarked.isnull() ] = df.Embarked.dropna().mode().values
```

1.  使用机器学习算法/模型来预测缺失数据：感觉只有数据量很大的情况下这样做才有效。

## 变量转换

变量转换的目的是将数据转换为模型适用的格式，不同方法实现的随机森林(Random Forest)接受不同类型的数据，Scikit-learn要求数据都是数字型`numeric`，所以我们要将原始数据转换为数字型`numeric`。

所有的数据可以分为两类：1.定性(Quantitative)变量可以以某种方式排序，Age就是一个很好的列子。2.定量(Qualitative)变量描述了物体的某一（不能被数学表示的）方面，Embarked就是一个例子。

### 定性(Qualitative)转换

1.  Dummy Variables：就是类别变量或者二元变量，当qualitative variable是一些频繁出现的几个独立变量时，Dummy Variables比较适合使用。我们以Embarked为例，Embarked只包含三个值`'S','C','Q'`，我们可以使用下面的代码将其转换为dummies:
2.  Factorizing：dummy不好处理Cabin（船舱号）这种标称属性，因为他出现的变量比较多。所以Pandas有一个方法叫做`factorize()`，它可以创建一些数字，来表示类别变量，对每一个类别映射一个ID，这种映射最后只生成一个特征，不像dummy那样生成多个特征。 下面的代码是对Cabin进行Factorizing：

```python
import re

# Replace missing values with "U0"
df['Cabin'][df.Cabin.isnull()] = 'U0'

# create feature for the alphabetical part of the cabin number
df['CabinLetter'] = df['Cabin'].map( lambda x : re.compile("([a-zA-Z]+)").search(x).group())

# convert the distinct cabin letters with incremental integer values
df['CabinLetter'] = pd.factorize(df['CabinLetter'])[0]
```

### 定量(Quantitative)转换

1.  Scaling Scaling可以将一个很大范围的数值映射到一个很小的范围(`通常是-1 - 1，或则是0 - 1`)，很多情况下我们需要将数值做Scaling使其范围大小一样，否则大范围数值特征将会由更高的权重。比如：Age的范围可能只是0-100，而income的范围可能是0-10000000，在某些对数组大小敏感的模型中会影响其结果。
    
    下面的代码是对Age进行Scaling：
    
    ```python
    # StandardScaler will subtract the mean from each value then scale to the unit variance
    scaler = preprocessing.StandardScaler()
    df['Age_scaled'] = scaler.fit_transform(df['Age'])
    ```
    
2.  Binning inning通过观察“邻居”(即周围的值)来连续数据离散化。存储的值被分布到一些“桶”或箱中，就像直方图的bin将数据划分成几块一样。下面的代码对Fare进行Binning。
    

```python
# Divide all fares into quartiles
df['Fare_bin'] = pd.qcut(df['Fare'], 4)

# qcut() creates a new variable that identifies the quartile range, but we can't use the string so either
# factorize or create dummies from the result
df['Fare_bin_id'] = pd.factorize(df['Fare_bin'])
df = pd.concat([df, pd.get_dummies(df['Fare_bin']).rename(columns=lambda x: 'Fare_' + str(x))], axis=1)
```

## 特征提取

特征提取很重要的一个方面是深入理解数据，并且能提取出新的特征来做预测。机器学习的核心就是模型选取和参数选择，特征提取可以说是重中之重。

一个特征提取的例子是，从电话号码中提取中国家、地区、城市的信息，或者是从GPS中提取中国家、地区、城市的信息。只要能描述一个事物的qualitative变量，都有可能从中挖掘出有用的特征，另外，时序等信息也是非常有用的。

泰坦尼克号的这些数据非常简单，我们并不需要对数据做太多的处理，我们下面只对name，cabin和ticket提取一些变量。

举两个例子吧：

1.  Name 姓名这个特征本身来说没有什么用，但是我们可以从中提取出一个特征，`称呼`。
    
    称呼，或许不同社会地位的人抢到逃生船的概率不同？代码如下：
    
    ```python
    # What is each person's title? 
    df['Title'] = df['Name'].map(lambda x: re.compile(", (.*?)\\.").findall(x)[0])
    
    # Group low-occuring, related titles together
    df['Title'][df.Title == 'Jonkheer'] = 'Master'
    df['Title'][df.Title.isin(['Ms','Mlle'])] = 'Miss'
    df['Title'][df.Title == 'Mme'] = 'Mrs'
    df['Title'][df.Title.isin(['Capt', 'Don', 'Major', 'Col', 'Sir'])] = 'Sir'
    df['Title'][df.Title.isin(['Dona', 'Lady', 'the Countess'])] = 'Lady'
    
    # Build binary features
    df = pd.concat([df, pd.get_dummies(df['Title']).rename(columns=lambda x: 'Title_' + str(x))], axis=1)
    ```
    
2.  Cabin 客舱信息包含了甲板和房间号，不同甲板位置不同，逃生船数量不同，人群年龄分布不同等等。不同房间号离甲板距离不同，离逃生船距离不同，等等。所以从客舱中提取中`甲板`和`房间号`这两个特征很重要。代码如下：
    
    ```python
    # Replace missing values with "U0"
    df['Cabin'][df.Cabin.isnull()] = 'U0'
    
    # Create a feature for the deck
    df['Deck'] = df['Cabin'].map( lambda x : re.compile("([a-zA-Z]+)").search(x).group())
    df['Deck'] = pd.factorize(df['Deck'])[0]
    
    # Create binary features for each deck
    decks = pd.get_dummies(df['Deck']).rename(columns=lambda x: 'Deck_' + str(x))
    df = pd.concat([df, decks], axis=1)
    
    # Create feature for the room number
    df['Room'] = df['Cabin'].map( lambda x : re.compile("([0-9]+)").search(x).group()).astype(int) + 1
    ```
    

## 开始处理

前面理论说了那么多，还是实战看看吧，我们要预处理每一个特征。

### 首先是Age（年龄）

Age（年龄）有263个缺失项，就简单地用平均值来填充，并看看填充前后的直方图：

```python
import pandas as pd
import matplotlib.pyplot as plt
import seaborn

fig, (axis1,axis2) = plt.subplots(1,2,figsize=(15,5))
axis1.set_title('Original Age values')
axis2.set_title('New Age values')
average_age   = df["Age"].mean()
df['Age'].plot(kind='hist', bins=70, ax=axis1)
df['Age'][df.Age.isnull()] = average_age
df['Age'].plot(kind='hist', bins=70, ax=axis2)
plt.show()
```

我们得到：

![e1BIid](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/e1BIid.jpg)

可以看到经过平均值填充后，数据分布并不是很好。试试随机选取`平均值加减标准差`范围的数来改进，使数据更接近真实情况。

```python
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn

fig, (axis1,axis2) = plt.subplots(1,2,figsize=(15,5))
axis1.set_title('Original Age values')
axis2.set_title('New Age values')
average_age   = df["Age"].mean()
std_age       = df["Age"].std()
count_nan_age = df["Age"].isnull().sum()
rand = np.random.randint(average_age - std_age, average_age + std_age, size = count_nan_age)
df['Age'].plot(kind='hist', bins=70, ax=axis1)
df['Age'][df.Age.isnull()] = rand
df['Age'].plot(kind='hist', bins=70, ax=axis2)
plt.show()
```

我们得到：

![[Pasted image 20230217002600.png]]

感觉这样好多了。

接着，我们需要从年龄中提取一个特征出来，即：孩子。不是说ladies and kids first么？

```python
def is_child(age):
	if age < 16:
		return 1
	else:
		return 0
df['Child'] = df['Age'].apply(is_child) #小于16岁的认为是孩子
fig, (axis1,axis2) = plt.subplots(1,2,figsize=(10,5))
seaborn.countplot(x='Child', data=df, ax=axis1)
child_survive = df[["Child", "Survived"]].groupby(['Child'],as_index=False).mean()
seaborn.barplot(x='Child', y='Survived', data=child_survive, ax=axis2)
plt.show()
```

我们得到：

![eHiKsz](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/eHiKsz.jpg)

孩子只有132人，却有着57%的生存率！看来是否是孩子，这一特征很重要。（数据支持，kids first，后面到Sex分析一下是不是ladies first）

****Cabin（客舱位置）**** 可以忽略

```python
df = df.drop(['Cabin'], axis=1)
```

****Embarked（港口编号）****

Embarked（港口编号）只有2个缺失项，直接用最常见的值填充它，然后用图表看看其与Survived的关系：

```python
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn

df.Embarked[ df.Embarked.isnull() ] = df.Embarked.dropna().mode().values
input_df_tmp = df[:input_df.shape[0]] #取出input_df部分，因为只有他们才有Survived特征。
(s,c,q) = df['Embarked'].value_counts()
embark_percentage = pd.DataFrame({ 
	'Embarked' : np.array(['S', 'C', 'Q']),
	'percentage' : np.array([float(i)/df['Embarked'].count() for i in (s,c,q)])})
fig, (axis1,axis2,axis3) = plt.subplots(1,3,figsize=(15,5))
seaborn.barplot(x='Embarked', y='percentage', data=embark_percentage, ax=axis1)
seaborn.countplot(x='Survived', hue="Embarked", data=input_df_tmp, order=[1,0], ax=axis2)
embark_perc = input_df_tmp[["Embarked", "Survived"]].groupby(['Embarked'],as_index=False).mean()
seaborn.barplot(x='Embarked', y='Survived', data=embark_perc,order=['S','C','Q'],ax=axis3)
plt.show()
```

我们得到：

![ICrD6R](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/ICrD6R.jpg)

分别是不同Embarked（港口编号）的百分比、不同Embarked（港口编号）生存的数量、不同Embarked（港口编号）的生存率。Embarked（港口编号）特征只有三种取值，且S占70%以上，所以Embarked（港口编号）这个特征应该不要？

### Fare（票价）

Fare（票价）只有1个缺失项,直接用平均值填充：

```python
df["Fare"] = df["Fare"].fillna(df["Fare"].median())
```

绘图看看Fare（票价）与Survived的关系：

```python
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn

fare_not_survived = df["Fare"][df["Survived"] == 0]
fare_survived     = df["Fare"][df["Survived"] == 1]
avgerage_fare = DataFrame([fare_not_survived.mean(), fare_survived.mean()])
df['Fare'].plot(kind='hist', figsize=(15,3), bins=100, xlim=(0,50))
avgerage_fare.index.names =  ["Survived"]
avgerage_fare.plot(kind='bar', legend=False)
plt.show()
```

我们得到：

![rwPHr3](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/rwPHr3.jpg)
![nrJ4Up](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/nrJ4Up.jpg)

可以看出票价集中在10左右，幸存的人的票价平均在48。

### Pclass（客舱等级）

Pclass（客舱等级）考虑做Dummy Variables处理，使其生成更多的特征。

```python
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn

input_df_tmp = df[:input_df.shape[0]]
seaborn.factorplot('Pclass', 'Survived', order=[1,2,3], data=input_df_tmp, size=6)
plt.show()
```

![1h3Dsf](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/1h3Dsf.jpg)

得到Pclass与Survived的关系，可以看出Pclass为3的生存率很低，我们试试把它的Dummy Variables去掉：

```python
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn

pclass_dummies  = pd.get_dummies(df['Pclass'])
pclass_dummies.columns = ['Class_1','Class_2','Class_3']
pclass_dummies.drop(['Class_3'], axis=1, inplace=True)
df.drop(['Pclass'],axis=1,inplace=True)
df = df.join(pclass_dummies)
```

### Sex（性别）

老规矩，首先看看Sex与Survived的关系：

```python
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn

fig, (axis1,axis2) = plt.subplots(1,2,figsize=(15,5))
seaborn.countplot(x='Sex', data=df, ax=axis1)
women_survive = df[["Sex", "Survived"]].groupby(['Sex'],as_index=False).mean()
seaborn.barplot(x='Sex', y='Survived', data=women_survive, ax=axis2)
plt.show()
```

我们得到：

![YC3mXf](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/YC3mXf.jpg)

果然是Ladies First呀！将Sex用数字表示:

```python
df['Sex'][df['Sex'] == 'male'] = 1
df['Sex'][df['Sex'] == 'female'] = 0
df['Sex'] = df['Sex'].astype(int)
```

现在除去之前已经drop的`PassengerId`,`Ticket`,`Cabin`,只剩下`Name`,`Parch`和`SibSp`了。

### Name（姓名），Parch（父母/孩子的数量），SibSp（配偶的数量）

我们需要从这里面提取中他们是否有家人在船上这一特征，因为有家人意味着逃生过程中会有家人的帮助，生存率可能更高。

```python
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn

df['WithFamily'] =  df["Parch"] + df["SibSp"]
df['WithFamily'].loc[df['WithFamily'] > 1] = 1
df['WithFamily'].loc[df['WithFamily'] == 0] = 0
#绘图
input_df_tmp = df[:input_df.shape[0]]
fig, (axis1,axis2) = plt.subplots(1,2,sharex=True,figsize=(10,5))
seaborn.countplot(x='WithFamily', data=df, order=[1,0], ax=axis1)
family_perc = input_df_tmp[["WithFamily", "Survived"]].groupby(['WithFamily'],as_index=False).mean()
seaborn.barplot(x='WithFamily', y='Survived', data=family_perc, order=[1,0], ax=axis2)
axis1.set_xticklabels(["With Family","Alone"], rotation=0)
plt.show()
```

我们得到:

![88czBr](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/88czBr.jpg)

可以看到，有家人在船上的人有更高的生存率；特征就处理到这里吧。

## 训练

机器学习的模型很多，用于分类有：

1.  回归算法：Logistic Regression、 Ordinary Least Square等等。
2.  决策树: CART、ID3、Random Forest等等。
3.  贝叶斯：Navie Bayesian、BBN等等。
4.  基于实例的算法：KNN、LVQ等等。
5.  组合模型、关联规则、神经网络、深度学习等等。

模型太多都看晕了，这种场景下选什么模型合适？因为我也不是很懂，所以大家可以自己查一下相关资料。在这里我选择了Random Forest和GBDT来试试。

**Random Forest:**

```python
from sklearn.ensemble import RandomForestClassifier
X = df[:input_df.shape[0]].values[:, 1::]
y = df[:input_df.shape[0]].values[:, 0]

X_test = df[input_df.shape[0]:].values[:, 1::]
random_forest = RandomForestClassifier(oob_score=True, n_estimators=1000)
random_forest.fit(X, y)

Y_pred = random_forest.predict(X_test)
print random_forest.score(X, y)
submission = pd.DataFrame({
	    "PassengerId": X_origin["PassengerId"],
	    "Survived": Y_pred.astype(int)
	})
submission.to_csv('result.csv', index=False)
```

**GBDT:**

```python
from sklearn.ensemble import GradientBoostingClassifier
X = df[:input_df.shape[0]].values[:, 1::]
y = df[:input_df.shape[0]].values[:, 0]

X_test = df[input_df.shape[0]:].values[:, 1::]
GBDT = GradientBoostingClassifier(n_estimators=1000)
GBDT.fit(X, y)

Y_pred = GBDT.predict(X_test)
print GBDT.score(X, y)
submission = pd.DataFrame({
	    "PassengerId": X_origin["PassengerId"],
	    "Survived": Y_pred.astype(int)
	})
submission.to_csv('result.csv', index=False)
```

完成后在Kaggle提交，只有`0.74641`分。

## 调优

再观察一下数据，看看还有那些特征可以用到，又去Google了一番，整理出三个新特征：称谓、家庭大小、姓。

**称谓:** 不同的称谓意味着不同的社会地位、不同的社会地位的人对人生、事物的理解不同。并且不同的社会地位乘坐逃生舱的概率也不同？可能某一类人的生存概率更高？

**家庭大小:** 一家七个人的逃生概率大还是一家两个人的逃生概率大呢？人多的家庭会不会更难逃生呢？

**姓:** 其实姓这个特征是为了辅助家庭这个特征的，同一个姓是一个家庭的概率更大？

```python
#处理姓
df['Surname'] = df['Name'].map(lambda x: re.compile("(Mr|Mrs|Miss|Master|Don|Rev|Dr|Mme|Ms|Major|Lady|Sir|Mlle|Col|Capt|the Countess|Jonkheer|Dona)\\.\\s(\\w*)").findall(x)[0][1])
df['Surname'] = pd.factorize(df['Surname'])[0]
#处理称谓
df['Title'] = df['Name'].map(lambda x: re.compile(", (.*?)\\.").findall(x)[0])
df['Title'][df.Title == 'Jonkheer'] = 'Master'
df['Title'][df.Title.isin(['Ms','Mlle'])] = 'Miss'
df['Title'][df.Title == 'Mme'] = 'Mrs'
df['Title'][df.Title.isin(['Capt', 'Don', 'Major', 'Col', 'Sir'])] = 'Sir'
df['Title'][df.Title.isin(['Dona', 'Lady', 'the Countess'])] = 'Lady'
df['Title_id'] = pd.factorize(df['Title'])[0]+1
df = df.drop(['Title'], axis=1)
df.drop(['Name'],axis=1,inplace=True)
df.drop(['Names'],axis=1,inplace=True)
#处理家庭大小
df['FamilySize'] =  df["Parch"] + df["SibSp"] + 1
df['FamilySize'].loc[df['FamilySize'] < 3] = 'small'
df['FamilySize'].loc[df['FamilySize'] != 'small'] = 'big'
df['FamilySize'][df['FamilySize'] == 'small'] = 0
df['FamilySize'][df['FamilySize'] == 'big'] = 1
df['FamilySize'] = df['FamilySize'].astype(int)
```

之前的Age和Fare忘了做Scaling处理，也把它加上：

```python
from sklearn import preprocessing
scaler = preprocessing.StandardScaler()
df['Fare_scaled'] = scaler.fit_transform(df['Fare'])
df = df.drop(['Fare'], axis=1)
df['Age_scaled'] = scaler.fit_transform(df['Age'])
df = df.drop(['Age'], axis=1)
```

下面我们看看目前这些特征的feature importance:

```python
features_list = df.columns.values[1::]

# Fit a random forest with (mostly) default parameters to determine feature importance
forest = RandomForestClassifier(oob_score=True, n_estimators=10000)
forest.fit(X, y)
feature_importance = forest.feature_importances_

# make importances relative to max importance
feature_importance = 100.0 * (feature_importance / feature_importance.max())

# Get the indexes of all features over the importance threshold
important_idx = np.where(feature_importance)[0]

# Get the sorted indexes of important features
sorted_idx = np.argsort(feature_importance[important_idx])[::-1]
print "\\nFeatures sorted by importance (DESC):\\n", important_features[sorted_idx]

# Adapted from <http://scikit-learn.org/stable/auto_examples/ensemble/plot_gradient_boosting_regression.html>
pos = np.arange(sorted_idx.shape[0]) + .5
plt.subplot(1, 2, 2)
plt.barh(pos, feature_importance[important_idx][sorted_idx[::-1]], align='center')
plt.yticks(pos, important_features[sorted_idx[::-1]])
plt.xlabel('Relative Importance')
plt.title('Variable Importance')
plt.show()
```

我们得到：

![nwobWe](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/nwobWe.jpg)

我们可以把后两个不重要的特征删掉：

```python
df = df.drop(['Child', 'FamilySize'], axis=1)
```

下面是参数调优，Sklean提供了两种方法，GridSearch和RandomizedSearch。在这两种情况下，都可以指定每个参数的取值范围，创建一个字典。将参数字典提供给search方法，它就会执行模型所指定的值的组合。GridSearch会测试参数每一个可能的组合。 而RandomizedSearch需要指定有多少不同的组合要测试，然后随机选择并组合他们。

```python
from sklearn import grid_search
sqrtfeat = int(np.sqrt(X.shape[1]))
minsampsplit = int(X.shape[0]*0.015)
def report(grid_scores, n_top=5):
    params = None
    top_scores = sorted(grid_scores, key=itemgetter(1), reverse=True)[:n_top]
    for i, score in enumerate(top_scores):
        print("Parameters with rank: {0}".format(i + 1))
        print("Mean validation score: {0:.4f} (std: {1:.4f})".format(
              score.mean_validation_score, np.std(score.cv_validation_scores)))
        print("Parameters: {0}".format(score.parameters))
        print("")
        
        if params == None:
            params = score.parameters
    
    return params
# Simple grid test
grid_test1 = { "n_estimators"      : [5000, 10000, 20000],
               "criterion"         : ["gini", "entropy"],
               "max_features"      : [sqrtfeat-1, sqrtfeat, sqrtfeat+1],
               "max_depth"         : [5, 10, 25],
               "min_samples_split" : [2, 5, 10, minsampsplit ] }

forest = RandomForestClassifier(oob_score=True)
 
print "Hyperparameter optimization using GridSearchCV..."
grid_search = grid_search.GridSearchCV(forest, grid_test1, n_jobs=-1, cv=10)
	
grid_search.fit(X, y)
Y_pred = grid_search.predict(X_test)
print grid_search.score(X, y)
```

由于我的机器太慢了，就忽略这一步了。

最后，我使用Random Forest, 加上参数max_depth=5 防止模型过拟合，并将n_estimators放到了30000，再次跑了提交Kaggle，这次得到了`0.8038`：

![Results](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/l1DnAD.jpg)

## 验证：学习曲线

最后我们用学习曲线(Learning Curves)验证一下该模型的准确率。

方法很简单，我们逐步增加training data，标出training score(模型是否overfit)和error rate(模型预测的结果是否正确)。即可。继续重复这个过程，选出200、300、400、500等等个数据作为training data，然后标出training score和error rate，得出一个曲线，即学习曲线(Learning Curves)。

下图是Professor Ng在coursea上[机器学习](https://www.coursera.org/course/ml)课程的ppt截图，描述了四种基本的曲线形状：

![Learning Curves](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/xs44iQ.jpg)

其中红线代表error rate，蓝线代表training score。

> 1.左上角是最优情况，随着样本的增加，error rate和training score都降低。2.右上角是最差情况，模型几乎无法预测数据，重新调整参数吧。3.左下角是high variance的情况，模型不够稳定，不能很好的fit新数据。4.右下角是high bias的情况，模型无法预测出准确的结果。

这里解释一下variance和bias的意思，引用[@Orangeprince](http://orangeprince.info/)的形象解释：

> 首先 Error = Bias + Variance，Error反映的是整个模型的准确度，Bias反映的是模型在样本上的输出与真实值之间的误差，即模型本身的精准度，Variance反映的是模型每一次输出结果与模型输出期望之间的误差，即模型的稳定性。举一个例子，一次打靶实验，目标是为了打到10环，但是实际上只打到了7环，那么这里面的Error就是3。具体分析打到7环的原因，可能有两方面：一是瞄准出了问题，比如实际上射击瞄准的是9环而不是10环；二是枪本身的稳定性有问题，虽然瞄准的是9环，但是只打到了7环。那么在上面一次射击实验中，Bias就是1,反应的是模型期望与真实目标的差距，而在这次试验中，由于Variance所带来的误差就是2，即虽然瞄准的是9环，但由于本身模型缺乏稳定性，造成了实际结果与模型期望之间的差距。

High variance，low bias意味着”overfitting”，模型过拟合导致不能很好的用于新数据。而High bias，low variance意味着”underfitting”，模型欠拟合导致不能很好从样本中学习，很难去预测新数据。Bias与Variance往往是不能兼得的。如果要降低模型的Bias，就一定程度上会提高模型的Variance，反之亦然。

例如，如果模型存在high variance，一个常见的解决方法是给他增加更多的特征。但是这样也会增加bias，这中间的平衡需要仔细考虑。后面的链接提供了一些解决这类问题的方法。

下面我们看看在scikit-learn中如何实现：

```python
from sklearn.learning_curve import learning_curve
def plot_learning_curve(estimator, title, X, y, ylim=None, cv=None,
                        n_jobs=1, train_sizes=np.linspace(.1, 1.0, 5)):
    """
    Generate a simple plot of the test and traning learning curve.

    Parameters
    ----------
    estimator : object type that implements the "fit" and "predict" methods
        An object of that type which is cloned for each validation.

    title : string
        Title for the chart.

    X : array-like, shape (n_samples, n_features)
        Training vector, where n_samples is the number of samples and
        n_features is the number of features.

    y : array-like, shape (n_samples) or (n_samples, n_features), optional
        Target relative to X for classification or regression;
        None for unsupervised learning.

    ylim : tuple, shape (ymin, ymax), optional
        Defines minimum and maximum yvalues plotted.

    cv : integer, cross-validation generator, optional
        If an integer is passed, it is the number of folds (defaults to 3).
        Specific cross-validation objects can be passed, see
        sklearn.cross_validation module for the list of possible objects

    n_jobs : integer, optional
        Number of jobs to run in parallel (default 1).
    """
    plt.figure()
    plt.title(title)
    if ylim is not None:
        plt.ylim(*ylim)
    plt.xlabel("Training examples")
    plt.ylabel("Score")
    train_sizes, train_scores, test_scores = learning_curve(
        estimator, X, y, cv=cv, n_jobs=n_jobs, train_sizes=train_sizes)
    train_scores_mean = np.mean(train_scores, axis=1)
    train_scores_std = np.std(train_scores, axis=1)
    test_scores_mean = np.mean(test_scores, axis=1)
    test_scores_std = np.std(test_scores, axis=1)
    plt.grid()

    plt.fill_between(train_sizes, train_scores_mean - train_scores_std,
                     train_scores_mean + train_scores_std, alpha=0.1,
                     color="r")
    plt.fill_between(train_sizes, test_scores_mean - test_scores_std,
                     test_scores_mean + test_scores_std, alpha=0.1, color="g")
    plt.plot(train_sizes, train_scores_mean, 'o-', color="r",
             label="Training score")
    plt.plot(train_sizes, test_scores_mean, 'o-', color="g",
             label="Cross-validation score")

    plt.legend(loc="best")
    return plt
title = "Learning Curves"
plot_learning_curve(RandomForestClassifier(oob_score=True, n_estimators=30000, max_depth=5), title, X, y, ylim=(0.5, 1.01), cv=None, n_jobs=4, train_sizes=[50, 100, 150, 200, 250, 350, 400])
plt.show()
```

我们得到：

![Learning Curves Result](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-02/K5fsQU.jpg)

## 总结

还有许多可以优化的地方，通过实战才能发现学习中不足的地方。
