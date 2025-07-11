def vnwqi(input_dict):
    import pandas as pd
    from app.features.vnwqi_calculation.utils.tables import group_definitions

    grouped_data = {group: {} for group in group_definitions}

    # Phân nhóm
    for param, value in input_dict.items():
        for group, param_list in group_definitions.items():
            if param in param_list:
                grouped_data[group][param] = value

    # Lọc NaN và không phải float
    def is_float(value):
        try:
            float(value)
            return True
        except (ValueError, TypeError):
            return False

    for group in grouped_data:
        grouped_data[group] = {
            k: float(v) for k, v in grouped_data[group].items()
            if v is not None and not pd.isna(v) and is_float(v)
        }

    # Kiểm tra số nhóm có dữ liệu
    valid_groups = [g for g, d in grouped_data.items() if len(d) > 0]
    if len(valid_groups) < 3:
        return {
            "WQI": None,
            "Note": "Cần ít nhất 3 nhóm thông số có giá trị hợp lệ"
        }

    # Kiểm tra nhóm IV
    if len(grouped_data.get("IV", {})) < 3:
        return {"WQI": None,
                "Note": "Nhóm IV cần có ít nhất 3 thông số"}

    # Tính toán WQI cho từng nhóm
    from app.features.vnwqi_calculation.utils.wqi_group import wqi_group_1, wqi_group_2, wqi_group_3, wqi_group_4, wqi_group_5
    wqi_1 = wqi_group_1(grouped_data["I"])
    wqi_2 = wqi_group_2(grouped_data["II"])
    wqi_3 = wqi_group_3(grouped_data["III"])
    wqi_4 = wqi_group_4(grouped_data["IV"])
    wqi_5 = wqi_group_5(grouped_data["V"])
    from app.features.vnwqi_calculation.utils.fomula import wqi_fomula
    # Tính toán WQI tổng
    wqi = wqi_fomula(wqi_1, wqi_2, wqi_3, wqi_4, wqi_5)
    if wqi is None:
        return {"WQI": None,
                "Note": "Lỗi trong quá trình tính toán WQI. Vui lòng kiểm tra lại dữ liệu đầu vào."}
    return {"WQI": wqi,
            "Note": None}
