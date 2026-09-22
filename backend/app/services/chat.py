def answer(msg,crop=None):
    x=msg.lower()
    if any(k in x for k in ['disease','leaf','spot','blight','fungus','pest']): r='Upload a clear leaf image in Disease AI. The pipeline uses OpenCV preprocessing and a trained PyTorch classifier when weights are installed. Confirm field symptoms with local agronomy guidance.'
    elif any(k in x for k in ['water','irrigat','rain']): r='Plan irrigation using soil moisture, forecast rain, temperature and crop stage. Avoid unnecessary irrigation before substantial rain and avoid prolonged crop water stress.'
    elif any(k in x for k in ['fertilizer','fertiliser','urea','npk']): r='Use crop type, growth stage and soil-test N-P-K values. The recommendation module provides decision support; exact product and dose should be locally confirmed.'
    elif any(k in x for k in ['weather','forecast','temperature','humidity']): r='Open the Weather page to retrieve the OpenWeatherMap forecast for your city. Combine weather with soil moisture and crop stage.'
    else: r='I can help with crop disease, fertilizer, irrigation, weather and crop management. Ask a specific farming question.'
    if crop: r+=f' Selected crop: {crop.crop_type} ({crop.growth_stage}).'
    return r
