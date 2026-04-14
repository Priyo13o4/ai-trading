
import sys

content = open(sys.argv[1]).read()

new_endpoint = """
@app.get("/api/news/{item_id}")
async def get_news_by_id(item_id: int, request: Request, response: Response, ctx=Depends(require_signals_context)):
    \"""Fetch a specific news record securely with TTL caching\"""
    logger.info(f"[API] GET /api/news/{item_id} - User: {ctx.get('user_id', 'anonymous')}")
    try:
        from app.db import get_news_by_id_from_db
        
        key = f"news:item:{item_id}"
        cached = await REDIS.get(key)
        if cached:
            logger.info(f"[API] Cache HIT for news ID {item_id}")
            return JSONResponse(content=json.loads(cached))
            
        logger.info(f"[API] Cache MISS for news ID {item_id}")
        row = await asyncio.to_thread(get_news_by_id_from_db, item_id)
        
        if not row:
            raise HTTPException(404, "News item not found")
            
        ttl = 60 * 60 # 60 minutes
        serialized = json_dumps(row)
        await REDIS.setex(key, ttl, serialized)
        
        return JSONResponse(content=json.loads(serialized))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[API ERROR] /api/news/{item_id}: {str(e)}", exc_info=True)
        raise HTTPException(500, "Internal server error")

"""

content = content.replace("@app.get(\"/api/news/upcoming\")", new_endpoint + "@app.get(\"/api/news/upcoming\")")
with open(sys.argv[1], "w") as f:
    f.write(content)

