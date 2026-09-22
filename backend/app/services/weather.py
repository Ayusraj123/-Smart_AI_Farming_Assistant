import httpx
from fastapi import HTTPException
from app.core.config import settings
async def weather(city):
    s=settings()
    if not s.openweather_api_key: raise HTTPException(503,'OpenWeatherMap API key is not configured')
    async with httpx.AsyncClient(timeout=10) as c:
        g=await c.get('https://api.openweathermap.org/geo/1.0/direct',params={'q':city,'limit':1,'appid':s.openweather_api_key})
        if g.status_code!=200 or not g.json(): raise HTTPException(404,'Location not found')
        p=g.json()[0]; lat,lon=p['lat'],p['lon']
        r=await c.get('https://api.openweathermap.org/data/2.5/forecast',params={'lat':lat,'lon':lon,'appid':s.openweather_api_key,'units':s.openweather_units})
        if r.status_code!=200: raise HTTPException(502,'Weather service failed')
        d=r.json()
    return {'location':{'name':p.get('name',city),'state':p.get('state'),'country':p.get('country'),'latitude':lat,'longitude':lon},'forecast':[{'time':i.get('dt_txt'),'temperature_c':i['main'].get('temp'),'humidity_pct':i['main'].get('humidity'),'rain_mm_3h':i.get('rain',{}).get('3h',0),'wind_mps':i.get('wind',{}).get('speed'),'description':i.get('weather',[{}])[0].get('description','')} for i in d.get('list',[])[:16]]}
