def fertilizer(x):
    n=0 if x.nitrogen is None else x.nitrogen; p=0 if x.phosphorus is None else x.phosphorus; k=0 if x.potassium is None else x.potassium
    if n<40: pr='high'; rec='Use a nitrogen-rich fertilizer in split applications, based on soil-test and crop-specific dose.'
    elif p<20: pr='medium'; rec='Use a phosphorus-containing fertilizer according to soil-test recommendation.'
    elif k<120: pr='medium'; rec='Use a potassium-containing fertilizer according to soil-test recommendation.'
    else: pr='low'; rec='Use balanced maintenance fertilization guided by soil test and crop requirements.'
    reasons=[f'Crop: {x.crop_type}',f'Growth stage: {x.growth_stage}',f'Indicative N-P-K: {n:g}-{p:g}-{k:g}']
    if x.disease and ('blight' in x.disease.lower() or 'fung' in x.disease.lower()): reasons.append('Avoid excessive nitrogen where fungal disease pressure is present.')
    return {'title':f'Fertilizer plan for {x.crop_type}','priority':pr,'recommendation':rec,'rationale':reasons,'estimated_quantity':f'Planning estimate only for {x.area_acres:g} acres; confirm exact kg/acre locally.'}
def irrigation(x):
    m=50 if x.soil_moisture is None else x.soil_moisture; t=25 if x.temperature_c is None else x.temperature_c; rain=x.rain_mm_next_24h
    if rain>=8: pr='low'; rec='Delay or reduce irrigation because meaningful rainfall is forecast.'
    elif m<30 or (t>=32 and m<45): pr='high'; rec='Irrigate soon with a measured crop-appropriate amount; avoid runoff and waterlogging.'
    elif m<45: pr='medium'; rec='Plan moderate irrigation and re-check soil moisture before application.'
    else: pr='low'; rec='No immediate irrigation is indicated; continue monitoring.'
    reasons=[f'Soil moisture: {m:.0f}%',f'Temperature: {t:.1f} C',f'Rain next 24h: {rain:.1f} mm',f'Growth stage: {x.growth_stage}']
    return {'title':f'Irrigation plan for {x.crop_type}','priority':pr,'recommendation':rec,'rationale':reasons,'estimated_quantity':'Use ET/crop-stage based scheduling for exact water volume; this system provides planning guidance.'}
