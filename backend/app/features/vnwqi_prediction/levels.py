# Table 7 in vn-wqi calculation guide
def wqi_level(wqi_value):
    status = ''
    if wqi_value is not None:
        if wqi_value < 10:
            status =  "Ô nhiễm rất nặng"
        elif wqi_value  >= 10 and wqi_value  <= 25:
            status =  "Kém"
        elif wqi_value >= 26 and wqi_value  <= 50:
            status =  "Xấu"
        elif wqi_value >= 51 and wqi_value  <= 75:
            status =  "Trung bình"
        elif wqi_value >= 75 and wqi_value <= 90:
            status =  "Tốt"
        elif wqi_value >= 91 and wqi_value  <= 100:
            status =  "Rất tốt"
    return status

def wqi_color(wqi_value):
    color = ''
    if wqi_value is not None:
        if wqi_value < 10:
            color =  'RGB(126,0,35)'
        elif wqi_value  >= 10 and wqi_value  <= 25:
            color =  'RGB(255,0,0)'
        elif wqi_value >= 26 and wqi_value  <= 50:
            color =  'RGB(255,126,0)'
        elif wqi_value >= 51 and wqi_value  <= 75:
            color =   'RGB(255,255,0)'
        elif wqi_value >= 75 and wqi_value <= 90:
            color = 'RGB(0,228,0)'
        elif wqi_value >= 91 and wqi_value  <= 100:
            color = 'RGB(51,51,255)'
    return color