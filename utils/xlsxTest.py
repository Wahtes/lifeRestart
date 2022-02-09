import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from pandas import Series, DataFrame

df = pd.read_excel('test.xlsx')
df

df['revenue'] = df['revenue'].replace(-1,0)
df['lower_tickers']=df['tickers'].apply(lambda ticker:ticker.lower())
df

df.to_excel('new_test.xlsx')

adf = pd.DataFrame(columns=['age','events'])
for index, row in df.head().iterrows():  # 遍历行
    print(row["$id"], row["time"])
    for interval in row['time'].split(','):
        interval.split('-')
        