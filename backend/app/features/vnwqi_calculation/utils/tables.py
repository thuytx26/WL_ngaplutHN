import pandas as pd
import numpy as np

group_definitions = {
    "I" : ["pH"], 
    "II" : ["Aldrin", "BHC", "Dieldrin", "DDTs", "Heptachlor & Heptachlorepoxide"],
    "III" : ["As", "Cd", "Pb", "Cr6", "Cu", "Zn", "Hg"],
    "IV" : ["DO", "T", "BOD5", "COD", "TOC", "N_NH4", "N_NO3", "N_NO2", "P_PO4"],
    "V": ["Coliform", "Ecoli"]
}

# table ph
ph_table = {
    'bpi': [5.5, 6, 8.5, 9],
    'qi': [50, 100, 100, 50]
}

# Table group II: Aldrin, BHC, Dieldrin, DDTs, Heptachlor & Heptachlorepoxide
group2_threshold = {
        "Aldrin" : 0.1,
        "BHC": 0.02,
        "Dieldrin" : 0.1,
        "DDTs" : 1.0,
        "Heptachlor & Heptachlorepoxide" : 0.2
}

# table group III:
as_table = {
    'bpi':[0.01, 0.02, 0.05, 0.1],
    'qi':[100, 75, 50, 25]
}

cd_table = {
    'bpi':[0.005, 0.008, 0.01, 0.1],
    'qi':[75, 50, 25, 10]
}

pb_table ={
    'bpi':[0.02, 0.04, 0.05, 0.5],
    'qi':[75, 50, 25, 10]
}

cr6_table = {
    'bpi':[0.01, 0.02, 0.04, 0.05, 0.1],
    'qi':[100, 75, 50, 25, 10]
}

cu_table = {
    'bpi':[0.1, 0.2, 0.5, 1.0, 2.0],
    'qi':[100, 75, 50, 25, 10]
}

zn_table ={
    'bpi':[0.5, 1.0, 1.5, 2.0, 3.0],
    'qi':[100, 75, 50, 25, 10]
}

hg_table = {
    'bpi':[0.001, 0.0015, 0.002, 0.01],
    'qi':[75, 50, 25, 10]
}

do_table = {
    'bpi' : [20, 50, 75, 88, 112, 125, 150, 200],
    'qi' : [25, 50, 75, 100, 100, 75, 50, 25]
}

bod5_table = {
    'bpi':[4, 6, 15, 25, 50],
    'qi':[100, 75, 50, 25, 10]
}

cod_table = {
    'bpi':[10, 15, 30, 50, 150],
    'qi':[100, 75, 50, 25, 10]
}

toc_table ={
    'bpi':[4, 6, 15, 25, 50],
    'qi':[100, 75, 50, 25, 10]
}

nnh4_table ={
    'bpi':[0.3, 0.6, 0.9, 5],
    'qi':[75, 50, 25, 10]
}

nno3_table ={
    'bpi':[2, 5, 10, 15],
    'qi':[100, 75, 52, 25]
}

# if nno2 <= 0.05, wqi nno2 = 100 else 10
nno2_threadsold = 0.05

ppo4_table ={
    'bpi':[0.1, 0.2, 0.3, 0.5, 4],
    'qi':[100, 75, 50, 25, 10]
}

coliform_table ={
    'bpi':[2500, 5000, 7500, 10000],
    'qi':[100, 75, 50, 25]
}

ecoli_table ={
    'bpi':[20, 50, 100, 200],
    'qi':[100, 75, 50, 25]
}