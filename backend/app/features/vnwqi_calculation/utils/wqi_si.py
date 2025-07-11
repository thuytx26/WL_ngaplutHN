from app.features.vnwqi_calculation.utils.tables import ph_table
from app.features.vnwqi_calculation.utils.fomula import first_fomula, second_fomula
'''GROUP I: pH'''
def wqi_ph(value):
    '''pH Water Quality Index
    input:
        value: pH value
    output:
        if pH < 5.5 or pH > 9, wqi_ph = 10
        if 6 <= pH <= 8.5, wqi_ph = 100
        if 5.5 < pH < 6 use second formula
        if 8.5 < pH < 9 use first formula
    '''

    bpi = ph_table['bpi']
    qi = ph_table['qi']
    if value < bpi[0] or value > bpi[3]:
        return 10
    elif value >= bpi[1] and value <= bpi[2]:
        return 100
    elif value > bpi[2] and value <= bpi[3]:
        return first_fomula(qi[2], qi[3], bpi[2], bpi[3], value)
    elif value >= bpi[0] and value < bpi[1]:
        return second_fomula(qi[0], qi[1], bpi[0], bpi[1], value)


'''GROUP II: (nhóm thông số thuốc bảo vệ thực vật)'''
from app.features.vnwqi_calculation.utils.tables import group2_threshold
def wqi_aldrin(value):
    '''Aldrin Water Quality Index
    input:
        value: Aldrin value (unit: ug/L)
        threshold: threshold value (unit: ug/L)
    output:
        if value <= threshold, wqi_aldrin = 100
        else, wqi_aldrin = 10
    '''
    if value <= group2_threshold['Aldrin']:
        return 100
    return 10

def wqi_bhc(value):
    '''BHC Water Quality Index 
    input:
        value: BHC value (unit: ug/L)
    output:
        if value <= threshold, wqi_BHC = 100
        else, wqi_BHC = 10
    '''
    if value <= group2_threshold['BHC']:
        return 100
    return 10

def wqi_dieldrin(value):
    '''Dieldrin Water Quality Index
    input:
        value: Dieldrin value (unit: ug/L)
        threshold: threshold value (unit: ug/L)
    output:
        if value <= thresold, wqi_dieldrin = 100
        else, wqi_dieldrin = 10
    '''
    if value <= group2_threshold['Dieldrin']:
        return 100
    return 10

def wqi_ddts(value):
    '''DDT Water Quality Index 
    input:
        value: DDT value (unit: ug/L)
    output:
        if value <= threshold, wqi_DDT = 100
        else, wqi_DDT = 10
    '''
    if value <= group2_threshold['DDTs']:
        return 100
    return 10

def wqi_heptachlor_heptachlorepoxide(value):
    '''Heptachlor & Heptachlorepoxide Water Quality Index 
    input:
        value: Heptachlor & Heptachlorepoxide value (unit: ug/L)
    output:
        if value <= threshold, wqi_heptachlor_heptachlorepoxide = 100
        else, wqi_heptachlor_heptachlorepoxide = 10
    '''
    if value <= group2_threshold['Heptachlor & Heptachlorepoxide']:
        return 100
    return 10

'''GROUP III: (nhóm thông số kim loại nặng): bao gồm các thông số As, Cd, 
Pb, Cr6+, Cu, Zn, Hg. '''

def wqi_as(value):
    '''As Water Quality Index
    input:
        value: As value (unit: mg/L)
    output:
        if value <= 0.01, wqi_as = 100
        else if value > 0.1, wqi_as = 10
        else follow the first fomula
    '''
    from app.features.vnwqi_calculation.utils.tables import as_table
    bpi = as_table['bpi']
    qi = as_table['qi']
    if value <= bpi[0]:
        return 100
    elif value > bpi[3]:
        return 10
    elif value > bpi[0] and value <= bpi[1]:
        return first_fomula(qi[0], qi[1], bpi[0], bpi[1], value)
    elif value > bpi[1] and value <= bpi[2]:
        return first_fomula(qi[1], qi[2], bpi[1], bpi[2], value)
    elif value > bpi[2] and value <= bpi[3]:
        return first_fomula(qi[2], qi[3], bpi[2], bpi[3], value)

def wqi_cd(value):
    '''Cd Water Quality Index
    input:
        value: Cd value (unit: mg/L)
    output:
        if value <= 0.005, wqi_cd = 100
        else if value > 0.1, wqi_cd = 10
        else follow the first fomula
    '''
    from app.features.vnwqi_calculation.utils.tables import cd_table
    bpi = cd_table['bpi']
    qi = cd_table['qi']
    if value < bpi[0]:
        return 100
    elif value > bpi[3]:
        return 10
    elif value in bpi:
        return qi[bpi.index(value)]
    for i in range(len(bpi) - 1):
        if value > bpi[i] and value < bpi[i + 1]:
            return first_fomula(qi[i], qi[i + 1], bpi[i], bpi[i + 1], value)

def wqi_pb(value):
    '''Pb Water Quality Index
    input:
        value: Pb value (unit: mg/L)
    output:
        if value < 0.02 wqi_pb = 100
        else if value > 0.5 wqi_pb = 10
        else follow the first fomula'''
    from app.features.vnwqi_calculation.utils.tables import pb_table
    bpi = pb_table['bpi']
    qi = pb_table['qi']
    if value < bpi[0]:
        return 100
    elif value > bpi[3]:
        return 10
    elif value in bpi:
        return qi[bpi.index(value)]
    for i in range(len(bpi) - 1):
        if value > bpi[i] and value < bpi[i + 1]:
            return first_fomula(qi[i], qi[i + 1], bpi[i], bpi[i + 1], value)
    
def wqi_cr6(value):
    '''Cr6+ Water Quality Index
    input:
        value: Cr6+ value (unit: mg/L)
    output:
        if value <= 0.01 wqi_cr6 = 100
        else if value >= 0.1 wqi_cr6 = 10
        else follow the first fomula'''
    from app.features.vnwqi_calculation.utils.tables import cr6_table
    bpi = cr6_table['bpi']
    qi = cr6_table['qi']
    if value <= bpi[0]:
        return 100
    elif value >= bpi[-1]:
        return 10
    elif value in bpi:
        return qi[bpi.index(value)]
    for i in range(len(bpi) - 1):
        if value > bpi[i] and value < bpi[i + 1]:
            return first_fomula(qi[i], qi[i + 1], bpi[i], bpi[i + 1], value)
        
def wqi_cu(value):
    '''Cu Water Quality Index
    input:
        value: Cu value (unit: mg/L)
    output:
        if value <= 0.1 wqi_cu = 100
        else if value >= 2 wqi_cu = 10
        else follow the first fomula'''
    from app.features.vnwqi_calculation.utils.tables import cu_table
    bpi = cu_table['bpi']
    qi = cu_table['qi']
    if value <= bpi[0]:
        return 100
    elif value >= bpi[-1]:
        return 10
    elif value in bpi:
        return qi[bpi.index(value)]
    for i in range(len(bpi) - 1):
        if value > bpi[i] and value < bpi[i + 1]:
            return first_fomula(qi[i], qi[i + 1], bpi[i], bpi[i + 1], value)
        
def wqi_zn(value):
    '''
    Zn Water Quality Index
    input:
        value: Zn value (unit: mg/L)
    output:
        if value <= .5 wqi_zn = 100
        else if value >= 3 wqi_zn = 10
        else follow the first fomula
    '''
    from app.features.vnwqi_calculation.utils.tables import zn_table
    bpi = zn_table['bpi']
    qi = zn_table['qi']
    if value <= bpi[0]:
        return 100
    elif value >= bpi[-1]:
        return 10
    elif value in bpi:
        return qi[bpi.index(value)]
    for i in range(len(bpi) - 1):
        if value > bpi[i] and value < bpi[i + 1]:
            return first_fomula(qi[i], qi[i + 1], bpi[i], bpi[i + 1], value)

def wqi_hg(value):
    '''
    Hg Water Quality Index
    input:
        value: Hg value (unit: mg/L)
    output:
        if value < .001 wqi_hg = 100
        else if value >= .01 wqi_hg = 10
        else follow the first fomula
    '''
    from app.features.vnwqi_calculation.utils.tables import hg_table
    bpi = hg_table['bpi']
    qi = hg_table['qi']
    if value <= bpi[0]:
        return 100
    elif value >= bpi[-1]:
        return 10
    elif value in bpi:
        return qi[bpi.index(value)]
    for i in range(len(bpi) - 1):
        if value > bpi[i] and value < bpi[i + 1]:
            return first_fomula(qi[i], qi[i + 1], bpi[i], bpi[i + 1], value)
        
'''GROUP IV: (nhóm thông số hữu cơ và dinh dưỡng): bao gồm các thông số 
DO, BOD5, COD, TOC, N-NH4, N-NO3, N-NO2, P-PO4'''

def wqi_do(value, temperature):
    '''
    DO Water Quality Index
    input:
        value: DO value (unit: mg/L)
        temperature: temperature value (unit: °C)
    process:
        step 1: DO saturation percent value
        step 2: calulation
    output:
        if DO saturation < 20 or DO saturation > 200 wqi_do = 10
        if 20 < DO% saturation < 88, use second fomula
        if 88 ≤ DO% saturation ≤ 112, thì WQIDO = 100. 
        Nếu 112 < DO% saturation < 200, WQIDO use first fomula
    '''
    # step 1:
    do_saturation = 14.652 - .41022*temperature + .0079910*temperature**2 - .000077774*temperature**3
    do_saturation_percent = value / do_saturation * 100
    # step 2:
    from app.features.vnwqi_calculation.utils.tables import do_table
    bpi = do_table['bpi']
    qi = do_table['qi']
    if do_saturation_percent < bpi[0] or do_saturation_percent > bpi[-1]:
        return 10
    if do_saturation_percent > bpi[3] and do_saturation_percent < bpi[4]:
        return 100
    if do_saturation_percent in bpi:
        return qi[bpi.index(do_saturation_percent)]
    if do_saturation_percent > bpi[0] and do_saturation_percent < bpi[3]:
        for i in range(0, 3):
            if do_saturation_percent > bpi[i] and do_saturation_percent < bpi[i + 1]:
                return second_fomula(qi[i], qi[i + 1], bpi[i], bpi[i + 1], do_saturation_percent)
    if do_saturation_percent > bpi[4] and do_saturation_percent < bpi[7]:
        for i in range(4, 7):
            if do_saturation_percent > bpi[i] and do_saturation_percent < bpi[i + 1]:
                return first_fomula(qi[i], qi[i + 1], bpi[i], bpi[i + 1], do_saturation_percent)
            
def wqi_bod5(value):
    '''
    BOD5 Water Quality Index
    input:
        value: BOD5 value (unit: mg/L)
    output:
        if value <= 2 wqi_bod5 = 100
        else if value >= 30 wqi_bod5 = 10
        else follow the first fomula
    '''
    from app.features.vnwqi_calculation.utils.tables import bod5_table
    bpi = bod5_table['bpi']
    qi = bod5_table['qi']
    if value <= bpi[0]:
        return 100
    elif value >= bpi[-1]:
        return 10
    elif value in bpi:
        return qi[bpi.index(value)]
    for i in range(len(bpi) - 1):
        if value > bpi[i] and value < bpi[i + 1]:
            return first_fomula(qi[i], qi[i + 1], bpi[i], bpi[i + 1], value)
        
def wqi_cod(value):
    '''
    COD Water Quality Index
    input:
        value: COD value (unit: mg/L)
    output:
        if value <= 10 wqi_cod = 100
        else if value >= 150 wqi_cod = 10
        else follow the first fomula
    '''
    from app.features.vnwqi_calculation.utils.tables import cod_table
    bpi = cod_table['bpi']
    qi = cod_table['qi']
    if value <= bpi[0]:
        return 100
    elif value >= bpi[-1]:
        return 10
    elif value in bpi:
        return qi[bpi.index(value)]
    for i in range(len(bpi) - 1):
        if value > bpi[i] and value < bpi[i + 1]:
            return first_fomula(qi[i], qi[i + 1], bpi[i], bpi[i + 1], value)
        
def wqi_toc(value):
    '''
    TOC Water Quality Index
    input:
        value: TOC value (unit: mg/L)
    output:
        if value <= 4 wqi_toc = 100
        else if value >= 50 wqi_toc = 10
        else follow the first fomula
    '''
    from app.features.vnwqi_calculation.utils.tables import toc_table
    bpi = toc_table['bpi']
    qi = toc_table['qi']
    if value <= bpi[0]:
        return 100
    elif value >= bpi[-1]:
        return 10
    elif value in bpi:
        return qi[bpi.index(value)]
    for i in range(len(bpi) - 1):
        if value > bpi[i] and value < bpi[i + 1]:
            return first_fomula(qi[i], qi[i + 1], bpi[i], bpi[i + 1], value)

def wqi_nnh4(value):
    '''
    N-NH4 Water Quality Index
    input:
        value: N-NH4 value (unit: mg/L)
    output:
        if value < 0.3 wqi_nnh4 = 100
        else if value >= 5 wqi_nnh4 = 10
        else follow the first fomula
    '''
    from app.features.vnwqi_calculation.utils.tables import nnh4_table
    bpi = nnh4_table['bpi']
    qi = nnh4_table['qi']
    if value < bpi[0]:
        return 100
    elif value >= bpi[-1]:
        return 10
    elif value in bpi:
        return qi[bpi.index(value)]
    for i in range(len(bpi) - 1):
        if value > bpi[i] and value < bpi[i + 1]:
            return first_fomula(qi[i], qi[i + 1], bpi[i], bpi[i + 1], value)
        
def wqi_nno3(value):
    '''
    N-NO3 Water Quality Index
    input:
        value: N-NO3 value (unit: mg/L)
    output:
        if value <= 2 wqi_nno3 = 100
        else if value >= 15 wqi_nno3 = 10
        else follow the first fomula'''
    from app.features.vnwqi_calculation.utils.tables import nno3_table
    bpi = nno3_table['bpi']
    qi = nno3_table['qi']
    if value <= bpi[0]:
        return 100
    elif value > bpi[-1]:
        return 10
    elif value in bpi:
        return qi[bpi.index(value)]
    for i in range(len(bpi) - 1):
        if value > bpi[i] and value < bpi[i + 1]:
            return first_fomula(qi[i], qi[i + 1], bpi[i], bpi[i + 1], value)
        
def wqi_nno2(value):
    '''
    N-NO2 Water Quality Index
    input:
        value: N-NO2 value (unit: mg/L)
    output:
        if value <=0.05 wqi_nno2 = 100
        else if value >= 0.05 wqi_nno2 = 10
        else follow the first fomula'''
    from app.features.vnwqi_calculation.utils.tables import nno2_threadsold
    if value <= nno2_threadsold:
        return 100
    return 10

def wqi_ppo4(value):
    '''
    P-PO4 Water Quality Index
    input:
        value: P-PO4 value (unit: mg/L)
    output:
        if value <= 0.1 wqi_ppo4 = 100
        else if value >= 4 wqi_ppo4 = 10
        else follow the first fomula
    '''
    from app.features.vnwqi_calculation.utils.tables import ppo4_table
    bpi = ppo4_table['bpi']
    qi = ppo4_table['qi']
    if value <= bpi[0]:
        return 100
    elif value >= bpi[-1]:
        return 10
    elif value in bpi:
        return qi[bpi.index(value)]
    for i in range(len(bpi) - 1):
        if value > bpi[i] and value < bpi[i + 1]:
            return first_fomula(qi[i], qi[i + 1], bpi[i], bpi[i + 1], value)
        
'''GROUP V: (nhóm thông số vi sinh): bao gồm các thông số Coliform, E.coli'''
def wqi_coliform(value):
    '''
    Coliform Water Quality Index
    input:
        value: Coliform value (unit: MPN/100ml)
    output:
        if value <= 2 500 wqi_coliform = 100
        else if value >= 10 000 wqi_coliform = 10
        else follow the first fomula
    '''
    from app.features.vnwqi_calculation.utils.tables import coliform_table
    bqi = coliform_table['bpi']
    qi = coliform_table['qi']
    if value <= bqi[0]:
        return 100
    elif value > bqi[-1]:
        return 10
    elif value in bqi:
        return qi[bqi.index(value)]
    for i in range(len(bqi) - 1):
        if value > bqi[i] and value < bqi[i + 1]:
            return first_fomula(qi[i], qi[i + 1], bqi[i], bqi[i + 1], value)

def wqi_ecoli(value):
    '''
    E.coli Water Quality Index
    input:
        value: E.coli value (unit: MPN/100ml)
    output:
        if value <= 20 wqi_ecoli = 100
        else if value > 200 wqi_ecoli = 10
        else follow the first fomula'''
    from app.features.vnwqi_calculation.utils.tables import ecoli_table
    bqi = ecoli_table['bpi']
    qi = ecoli_table['qi']
    if value <= bqi[0]:
        return 100
    elif value > bqi[-1]:
        return 10
    elif value in bqi:
        return qi[bqi.index(value)]
    for i in range(len(bqi) - 1):
        if value > bqi[i] and value < bqi[i + 1]:
            return first_fomula(qi[i], qi[i + 1], bqi[i], bqi[i + 1], value)
