import pandas as pd
df = pd.read_csv("wqi_prepared.csv")
df['bod5'] = df['wqi'] * 0.5  # Example calculation for BOD5
df['cod'] = df['wqi'] * 0.6  # Example calculation
df.to_csv("wqi_prepared_new.csv", index=False)