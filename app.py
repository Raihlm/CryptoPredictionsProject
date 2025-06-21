from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
import pandas as pd
import numpy as np
import requests
import asyncio
import aiohttp
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from datetime import datetime, timedelta
import json
import os
import logging
from typing import Dict, List, Optional
import schedule
import threading
import time
from pydantic import BaseModel
import ssl


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


app = FastAPI(title="Bitcoin Price Prediction API", version="1.0.0")


app.mount("/web/static", StaticFiles(directory="web/static"), name="static")


models = {}
scalers = {}
model_performance = {}
latest_predictions = {}
historical_data = None
is_models_ready = False


class PredictionRequest(BaseModel):
    model: str
    current_price: float
    features: List[float]

class PredictionResponse(BaseModel):
    predictions: Dict
    model_used: str
    timestamp: str


DATA_PATH = "Dataset/Historical/HistoricalData.csv"
COINGECKO_API_URL = "https://api.coingecko.com/api/v3/coins/bitcoin"
PREDICTION_SCHEDULE_HOUR = 12  # Run at 12 PM daily

def load_historical_data() -> pd.DataFrame:
    """Load and prepare historical data"""
    try:
        if os.path.exists(DATA_PATH):
            df = pd.read_csv(DATA_PATH)
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date').reset_index(drop=True)
            logger.info(f"Loaded {len(df)} historical records")
            return df
        else:
            logger.warning(f"Historical data file not found at {DATA_PATH}")
            return pd.DataFrame()
    except Exception as e:
        logger.error(f"Error loading historical data: {e}")
        return pd.DataFrame()

def preprocess_data(df: pd.DataFrame) -> tuple:
    """Preprocess data with normalization"""
    try:
        # Create features for prediction
        df_processed = df.copy()
        
        # Add technical indicators
        df_processed['price_ma_7'] = df_processed['price'].rolling(window=7).mean()
        df_processed['price_ma_30'] = df_processed['price'].rolling(window=30).mean()
        df_processed['volatility'] = df_processed['price'].rolling(window=7).std()
        df_processed['volume_ma'] = df_processed['volume'].rolling(window=7).mean()
        
        # Create target variable (next day price)
        df_processed['target'] = df_processed['price'].shift(-1)
        
        # Remove rows with NaN values
        df_processed = df_processed.dropna()
        
        # Select features for training
        feature_columns = ['price', 'open', 'high', 'low', 'volume', 'change', 
                          'price_ma_7', 'price_ma_30', 'volatility', 'volume_ma']
        
        X = df_processed[feature_columns]
        y = df_processed['target']
        
        # Initialize scaler
        scaler = MinMaxScaler()
        X_scaled = scaler.fit_transform(X)
        
        logger.info(f"Preprocessed data: {X_scaled.shape[0]} samples, {X_scaled.shape[1]} features")
        return X_scaled, y.values, scaler, feature_columns
        
    except Exception as e:
        logger.error(f"Error preprocessing data: {e}")
        return None, None, None, None

def train_models(X, y, scaler, feature_columns):
    """Train prediction models"""
    global models, scalers, model_performance, is_models_ready
    is_models_ready = True  # Set to True initially, will be updated based on success
    
    try:
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, shuffle=False
        )
        
        # Initialize models
        models_to_train = {
            'linear': LinearRegression(),
            'random_forest': RandomForestRegressor(n_estimators=100, random_state=42)
        }
        
        trained_models = {}
        performance_metrics = {}
        
        for model_name, model in models_to_train.items():
            logger.info(f"Training {model_name} model...")
            
            # Train model
            model.fit(X_train, y_train)
            
            # Make predictions
            y_pred = model.predict(X_test)
            
            # Calculate metrics
            r2 = r2_score(y_test, y_pred)
            mae = mean_absolute_error(y_test, y_pred)
            rmse = np.sqrt(mean_squared_error(y_test, y_pred))
            
            trained_models[model_name] = model
            performance_metrics[model_name] = {
                'r2_score': r2,
                'mae': mae,
                'rmse': rmse,
                'training_samples': len(X_train),
                'test_samples': len(X_test)
            }
            
            logger.info(f"{model_name} - R²: {r2:.4f}, MAE: {mae:.2f}, RMSE: {rmse:.2f}")
        
        # Update global variables
        models = trained_models
        scalers = {'features': scaler, 'feature_columns': feature_columns}
        model_performance = performance_metrics
        is_models_ready = True
        
        logger.info("All models trained successfully")
        return True
        
    except Exception as e:
        logger.error(f"Error training models: {e}")
        return False

async def fetch_realtime_data():
    """Fetch real-time Bitcoin data from CoinGecko API"""
    try:
        async with aiohttp.ClientSession() as session:
            params = {
                'localization': 'false',
                'tickers': 'false',
                'market_data': 'true',
                'community_data': 'false',
                'developer_data': 'false',
                'sparkline': 'false'
            }
            
            async with session.get(COINGECKO_API_URL, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    market_data = data.get('market_data', {})
                    
                    realtime_data = {
                        'date': datetime.now().strftime('%Y-%m-%d'),
                        'price': market_data.get('current_price', {}).get('usd', 0),
                        'open': market_data.get('current_price', {}).get('usd', 0),  # Approximation
                        'high': market_data.get('high_24h', {}).get('usd', 0),
                        'low': market_data.get('low_24h', {}).get('usd', 0),
                        'volume': market_data.get('total_volume', {}).get('usd', 0),
                        'change': market_data.get('price_change_percentage_24h', 0)
                    }
                    
                    logger.info(f"Fetched real-time data: BTC ${realtime_data['price']:,.2f}")
                    return realtime_data
                else:
                    logger.error(f"API request failed with status: {response.status}")
                    return None
                    
    except Exception as e:
        logger.error(f"Error fetching real-time data: {e}")
        return None

def append_realtime_data(new_data):
    """Append new real-time data to historical dataset"""
    try:
        if not os.path.exists(DATA_PATH):
            logger.error(f"Historical data file not found: {DATA_PATH}")
            return False
            
        # Load existing data
        df = pd.read_csv(DATA_PATH)
        
        # Check if data for today already exists
        today = datetime.now().strftime('%Y-%m-%d')
        if today in df['date'].values:
            logger.info(f"Data for {today} already exists, skipping append")
            return True
            
        # Append new data
        new_row = pd.DataFrame([new_data])
        df = pd.concat([df, new_row], ignore_index=True)
        
        # Save updated data
        df.to_csv(DATA_PATH, index=False)
        logger.info(f"Appended new data for {today}")
        return True
        
    except Exception as e:
        logger.error(f"Error appending real-time data: {e}")
        return False

def generate_predictions(current_data):
    """Generate predictions using trained models"""
    global models, scalers, latest_predictions
    
    try:
        if not is_models_ready:
            logger.warning("Models not ready for prediction")
            return None
            
        scaler = scalers['features']
        feature_columns = scalers['feature_columns']
        
        # Prepare features from current data
        features = np.array([[
            current_data['price'],
            current_data['open'],
            current_data['high'],
            current_data['low'],
            current_data['volume'],
            current_data['change'],
            current_data['price'],  # price_ma_7 (simplified)
            current_data['price'],  # price_ma_30 (simplified)
            abs(current_data['high'] - current_data['low']),  # volatility approximation
            current_data['volume']  # volume_ma (simplified)
        ]])
        
        # Scale features
        features_scaled = scaler.transform(features)
        
        predictions = {}
        
        for model_name, model in models.items():
            base_prediction = model.predict(features_scaled)[0]
            
            # Generate multiple timeframe predictions dengan format yang konsisten
            predictions[model_name] = {
                'next_day': base_prediction,
                'next_week': base_prediction * (1 + np.random.normal(0, 0.05)),
                'next_month': base_prediction * (1 + np.random.normal(0, 0.15)),
                'next_year': base_prediction * (1 + np.random.normal(0, 0.30)),
                # Tambahkan confidence scores terpisah
                'confidence': {
                    'next_day': model_performance[model_name]['r2_score'] * 100,
                    'next_week': model_performance[model_name]['r2_score'] * 90,
                    'next_month': model_performance[model_name]['r2_score'] * 75,
                    'next_year': model_performance[model_name]['r2_score'] * 50
                }
            }
        
        latest_predictions = predictions
        logger.info("Generated predictions successfully")
        return predictions
        
    except Exception as e:
        logger.error(f"Error generating predictions: {e}")
        return None

async def daily_automation():
    """Daily automation task - runs at scheduled time"""
    try:
        logger.info("Starting daily automation task...")
        
        # 1. Fetch real-time data
        realtime_data = await fetch_realtime_data()
        if not realtime_data:
            logger.error("Failed to fetch real-time data")
            return
            
        # 2. Append to historical data
        if not append_realtime_data(realtime_data):
            logger.error("Failed to append real-time data")
            return
            
        # 3. Reload and retrain models
        global historical_data
        historical_data = load_historical_data()
        
        if len(historical_data) > 50:  # Minimum data requirement
            X, y, scaler, feature_columns = preprocess_data(historical_data)
            if X is not None:
                success = train_models(X, y, scaler, feature_columns)
                if success:
                    # 4. Generate new predictions
                    generate_predictions(realtime_data)
                    logger.info("Daily automation completed successfully")
                else:
                    logger.error("Model training failed")
            else:
                logger.error("Data preprocessing failed")
        else:
            logger.warning("Insufficient data for model training")
            
    except Exception as e:
        logger.error(f"Error in daily automation: {e}")

def run_scheduler():
    """Run the scheduler in a separate thread"""
    schedule.every().day.at(f"{PREDICTION_SCHEDULE_HOUR:02d}:00").do(
        lambda: asyncio.run(daily_automation())
    )
    
    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every minute

# API Endpoints
@app.on_event("startup")
async def startup_event():
    """Initialize the application"""
    global historical_data
    
    logger.info("Starting Bitcoin Prediction API...")
    
    # Load historical data and train initial models
    historical_data = load_historical_data()
    
    if len(historical_data) > 50:
        X, y, scaler, feature_columns = preprocess_data(historical_data)
        if X is not None:
            train_models(X, y, scaler, feature_columns)
    
    # Start scheduler in background thread
    scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
    scheduler_thread.start()
    
    logger.info("Application startup completed")

@app.get("/", response_class=HTMLResponse)
async def read_root():
    with open("web/dashboard.html", "r") as f:
        html_content = f.read()
    return HTMLResponse(content=html_content)

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "models_loaded": is_models_ready,
        "timestamp": datetime.now().isoformat(),
        "available_models": list(models.keys()) if models else []
    }

@app.post("/api/predict")
async def predict_price(request: PredictionRequest):
    """Generate price predictions"""
    try:
        logger.info(f"Received prediction request: {request}")

        if not is_models_ready:
            raise HTTPException(status_code=503, detail="Models not ready")
            
        if request.model not in models:
            raise HTTPException(status_code=400, detail=f"Model '{request.model}' not available")
        
        # Create current data from request
        current_data = {
            'price': request.current_price,
            'open': request.current_price,
            'high': request.current_price * 1.02,
            'low': request.current_price * 0.98,
            'volume': request.features[1] if len(request.features) > 1 else 1000000,
            'change': request.features[2] if len(request.features) > 2 else 0
        }
        
        predictions = generate_predictions(current_data)
        
        if predictions and request.model in predictions:
            # Return format yang konsisten dengan JavaScript
            return PredictionResponse(
                predictions=predictions[request.model],  # Sudah dalam format yang benar
                model_used=request.model,
                timestamp=datetime.now().isoformat()
            )
        else:
            raise HTTPException(status_code=500, detail="Prediction generation failed")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in predict endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/realtime-data")
async def get_realtime_data():
    """Fetch real-time data from CoinGecko API"""
    try:
        logger.info("Fetching real-time data from CoinGecko...")
        url = "https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&market_data=true"

        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE

        async with aiohttp.ClientSession(connector=aiohttp.TCPConnector(ssl=ssl_context)) as session:
            async with session.get(url) as response:
                logger.info(f"CoinGecko response status: {response.status}")
                if response.status == 200:
                    data = await response.json()
                    logger.info(f"Data received from CoinGecko: {data}")
                    if 'market_data' not in data:
                        logger.error("Missing 'market_data' in CoinGecko response")
                        raise HTTPException(status_code=500, detail="Invalid data format from CoinGecko")
                    
                    market_data = data['market_data']
                    return {
                        "price": market_data.get('current_price', {}).get('usd', None),
                        "open": market_data.get('open_24h', {}).get('usd', 0),
                        "high": market_data.get('high_24h', {}).get('usd', None),
                        "low": market_data.get('low_24h', {}).get('usd', None),
                        "volume": market_data.get('total_volume', {}).get('usd', None),
                        "change": market_data.get('price_change_percentage_24h', None)
                    }
                else:
                    logger.error(f"Failed to fetch data from CoinGecko: {response.status}")
                    raise HTTPException(status_code=response.status, detail="Failed to fetch real-time data")
    except Exception as e:
        logger.error(f"Error fetching real-time data: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/predictions")
async def get_latest_predictions():
    """Get latest predictions for all models"""
    if not latest_predictions:
        return []
    
    
    predictions_list = []
    
    try:
        for model_name, model_predictions in latest_predictions.items():
            # Skip confidence data when iterating
            for timeframe, predicted_value in model_predictions.items():
                if timeframe == 'confidence':  # Skip confidence scores
                    continue
                    
                # Get confidence score for this timeframe if available
                confidence_score = 0
                if 'confidence' in model_predictions and timeframe in model_predictions['confidence']:
                    confidence_score = model_predictions['confidence'][timeframe]
                
                predictions_list.append({
                    "date": datetime.now().strftime('%Y-%m-%d'),
                    "model": model_name,
                    "timeframe": timeframe,
                    "predicted_price": float(predicted_value),  # Ensure it's a number
                    "confidence": float(confidence_score)
                })
                
        return predictions_list
        
    except Exception as e:
        logger.error(f"Error in get_latest_predictions: {e}")
        return {"error": f"Failed to retrieve predictions: {str(e)}"}

@app.get("/api/model-performance")
async def get_model_performance():
    """Get model performance metrics"""
    if not model_performance:
        return {"error": "No performance data available"}
    
    # Return aggregated performance (average across models)
    if model_performance:
        avg_r2 = np.mean([perf['r2_score'] for perf in model_performance.values()])
        avg_mae = np.mean([perf['mae'] for perf in model_performance.values()])
        avg_rmse = np.mean([perf['rmse'] for perf in model_performance.values()])
        
        return {
            "r2_score": avg_r2,
            "mae": avg_mae,
            "rmse": avg_rmse,
            "models_count": len(model_performance),
            "individual_performance": model_performance
        }
    
    return {"error": "No performance data available"}

@app.post("/api/trigger-update")
async def trigger_model_update():
    """Manually trigger model update"""
    try:
        await daily_automation()
        return {"status": "success", "message": "Model update completed"}
    except Exception as e:
        logger.error(f"Manual update failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/data-stats")
async def get_data_statistics():
    """Get dataset statistics"""
    if historical_data is not None and len(historical_data) > 0:
        return {
            "total_records": len(historical_data),
            "date_range": {
                "start": historical_data['date'].min(),
                "end": historical_data['date'].max()
            },
            "price_stats": {
                "current": float(historical_data['price'].iloc[-1]),
                "min": float(historical_data['price'].min()),
                "max": float(historical_data['price'].max()),
                "mean": float(historical_data['price'].mean())
            },
            "last_updated": datetime.now().isoformat()
        }
    else:
        return {"error": "No data available"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")