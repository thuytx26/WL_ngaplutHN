# This file contains the fomula to calculate the WQI SI value
import pandas as pd
import numpy as np
def first_fomula(qi, qi_add_1, bpi, bpi_add_1, cp):
    '''First fomula
    input:
        qi: qi value (Giá trị WQI ở mức i đã cho trong
            bảng tương ứng với giá trị BPi)
        qi_add_1: qi+1 value (Giá trị WQI ở mức i+1 cho
              trong bảng tương ứng với giá trị BPi+1 )
        bpi: bpi value (Nồng độ giới hạn dưới của giá 
            trị thông số quan trắc)
        bpi_add_1: bpi+1 value (Nồng độ giới hạn trên 
        của giá trị thông số quan trắc)
        cp: Cp value (Giá trị của thông số quan trắc 
        được đưa vào tính toán. )
    output:
        follow the first fomula
    '''
    wqisi = (qi - qi_add_1) * (bpi_add_1 - cp) \
            / (bpi_add_1 - bpi) \
            + qi_add_1
    return wqisi

def second_fomula(qi, qi_add_1, bpi, bpi_add_1, cp):
    '''Second fomula
    input:
        qi: qi value (Giá trị WQI ở mức i đã cho trong
            bảng tương ứng với giá trị BPi)
        qi_add_1: qi+1 value (Giá trị WQI ở mức i+1 cho
              trong bảng tương ứng với giá trị BPi+1 )
        bpi: bpi value (Nồng độ giới hạn dưới của giá 
            trị thông số quan trắc)
        bpi_add_1: bpi+1 value (Nồng độ giới hạn trên 
        của giá trị thông số quan trắc)
        cp: Cp value (Giá trị của thông số quan trắc 
        được đưa vào tính toán. )'
    output:
        follow the second fomula
    '''
    wqisi = (qi_add_1 - qi) * (cp - bpi) \
            / (bpi_add_1 - bpi) \
            + qi
    return wqisi

def wqi_fomula(wqi_1, wqi_2, wqi_3, wqi_4, wqi_5, weighted=False):
    '''Third fomula
    input:
        wqi_1: WQI value of group I or None
        wqi_2: WQI value of group II or None
        wqi_3: WQI value of group III or None
        wqi_4: WQI value of group IV
        wqi_5: WQI value of group V or None
    output:
        follow the 3, 4, 5 fomula
    '''
    # Kiểm tra điều kiện tối thiểu
    input_list = [wqi_1, wqi_2, wqi_3, wqi_4, wqi_5]
    num_none = sum(x is None for x in input_list)

    if wqi_4 is None or num_none > 2:
        return None  # Không đủ điều kiện tính

    # Thay thế nhóm thiếu bằng 100 (trung tính)
    wqi_1 = wqi_1 if wqi_1 is not None else 100
    wqi_2 = wqi_2 if wqi_2 is not None else 100
    wqi_3 = wqi_3 if wqi_3 is not None else 100

    # Tính toán theo công thức phù hợp
    if not weighted:
        if wqi_5 is None:
            # Công thức 2: không có nhóm 5
            wqi = (wqi_1 / 100) * (wqi_2 / 100) * (wqi_3 / 100) * wqi_4
        else:
            # Công thức 1: đầy đủ nhóm 5
            wqi = (wqi_1 / 100) * (wqi_2 / 100) * (wqi_3 / 100) * ((wqi_4 * wqi_5) ** 0.5)
    else:
        if wqi_5 is None:
            wqi = None  # Công thức 3 yêu cầu phải có nhóm 5
        else:
            # Công thức 3: có trọng số
            wqi = (wqi_1 / 100) * (wqi_2 / 100) * (wqi_3 / 100) * (((wqi_4 ** 2) * wqi_5) ** (1 / 3))

    # round wqi
    if wqi is not None:
        wqi = int(round(wqi))
    return wqi
