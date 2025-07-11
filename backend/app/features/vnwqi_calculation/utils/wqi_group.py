from app.features.vnwqi_calculation.utils.tables import group_definitions
def wqi_group_1(params_data: dict) -> float | None:
    from app.features.vnwqi_calculation.utils.wqi_si import wqi_ph
    if "pH" in params_data:
        return wqi_ph(params_data["pH"])
    return None

def wqi_group_2(params_data: dict) -> float | None:
    from app.features.vnwqi_calculation.utils.wqi_si import wqi_aldrin, wqi_bhc, wqi_dieldrin, wqi_ddts, wqi_heptachlor_heptachlorepoxide
    import math

    group2_functions = {
        "Aldrin": wqi_aldrin,
        "BHC": wqi_bhc,
        "Dieldrin": wqi_dieldrin,
        "DDTs": wqi_ddts,
        "Heptachlor & Heptachlorepoxide": wqi_heptachlor_heptachlorepoxide
    }

    results = {}
    for param in group_definitions["II"]:
        if param in params_data:
            results[param] = group2_functions[param](params_data[param])

    if len(results) == 0:
        return None

    product = 1
    for value in results.values():
        product *= value

    geometric_mean = product ** (1 / len(results))
    return geometric_mean

def wqi_group_3(params_data: dict) -> float | None:
    from app.features.vnwqi_calculation.utils.wqi_si import wqi_as, wqi_cd, wqi_pb, wqi_cr6, wqi_cu, wqi_zn, wqi_hg
    import math

    group3_functions = {
        "As": wqi_as,
        "Cd": wqi_cd,
        "Pb": wqi_pb,
        "Cr6": wqi_cr6,
        "Cu": wqi_cu,
        "Zn": wqi_zn,
        "Hg": wqi_hg
    }

    results = {}
    for param in group_definitions["III"]:
        if param in params_data:
            results[param] = group3_functions[param](params_data[param])

    if len(results) == 0:
        return None

    product = 1
    for value in results.values():
        product *= value

    geometric_mean = product ** (1 / len(results))
    return geometric_mean

def wqi_group_4(params_data: dict) -> float | None:
    from app.features.vnwqi_calculation.utils.wqi_si import wqi_do, wqi_bod5, wqi_cod, wqi_toc, wqi_nnh4, wqi_nno3, wqi_nno2, wqi_ppo4

    group4_functions = {
        "DO": wqi_do,
        "BOD5": wqi_bod5,
        "COD": wqi_cod,
        "TOC": wqi_toc,
        "N_NH4": wqi_nnh4,
        "N_NO3": wqi_nno3,
        "N_NO2": wqi_nno2,
        "P_PO4": wqi_ppo4
    }

    results = {}
    for param in group_definitions["IV"]:
        if param in params_data:
            if param == "DO":
                # DO phụ thuộc nhiệt độ (T) → đảm bảo "T" phải có mặt
                if "T" in params_data:
                    results[param] = group4_functions[param](params_data[param], params_data["T"])
            elif param != "T":  # T chỉ dùng để tính DO, không có chỉ số riêng
                results[param] = group4_functions[param](params_data[param])

    if len(results) == 0:
        return None

    average = sum(results.values()) / len(results)
    return average

def wqi_group_5(params_data: dict) -> float | None:
    from app.features.vnwqi_calculation.utils.wqi_si import wqi_coliform, wqi_ecoli

    group5_functions = {
        "Coliform": wqi_coliform,
        "Ecoli": wqi_ecoli
    }

    results = {}
    for param in group_definitions["V"]:
        if param in params_data:
            results[param] = group5_functions[param](params_data[param])

    if len(results) == 0:
        return None

    average = sum(results.values()) / len(results)
    return average