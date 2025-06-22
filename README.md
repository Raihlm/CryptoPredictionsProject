#  Crypto Price Predictor 

A project for learning Machine Learning to predict Bitcoin price
-----------------------------------------------------------------------------------------------------------------------------

# Project Description
This project built as part of learning about how we could apply machine learning model in financial industry and learn about cryptocurrency. We Build This Project by:
 - Using historical data from 2010 until 6 June 2025
 - Pulling realtime data automatically from coingecko API every 24 hours at 12PM ( On Progress )
 - predict next day, next week,next month and year 
 - Integrating Sentiment Analysis ( On Progress )

-----------------------------------------------------------------------------------------------------------------------------

# Feature
- Predict next day price (main Features)
- we predict next week, month, year based on the next day price prediction * some np.random for estimating technique and because our model has it weak on predicting a long time.
- the dashboard integrate realtime price from coingecko that update every 1 minute
- visualitation of historical data with candlestick and line charts
- confidence(from R Square * 100) and round it (for example our linear regression is 99,97% it rounded to 100), and model evaluation.
-----------------------------------------------------------------------------------------------------------------------------
# Folder Structure
```bash
CryptoPredictionProject/
│
├── data/
│   ├── raw/             # Historical data from investing.com that seperated to historical from 2010 - 2025 24 March, etc
│   ├── processed/       # Dataset that processed ( we not gonna use that for now )
│   └── Historical/      # the dataset we used currently for training model, soon we will update it with realtime data update and store the data there
│
├── notebooks/
│   ├── 01_data_wrangling.ipynb # it contains data cleaning, and data exploration
│   ├── 02_modelTraining.ipynb # this is the notebooks file to create a model before ( we not gonna use this )
│   ├── loadJSONDATA.ipynb # to make a json data for displaying candlestick and line chart in dashboard
│   ├── cekModel.ipynb # (we not gonna use this in this project)
│   ├── sentimentAnalysis.ipynb # we will add new features soon for creating a sentiment analysis and integrate it with the predictions, or just a helper indicator for trading.
│
├── web/
│   ├── static/               # Styling and frontend dashboard, and data for chart
│   ├── dashboard.html         # main dashboard
│   ├── bitcoinInfo.html      
│      
├── models/  
│   └── # it contains all the models that trained on modelTraining,ipynb file, but we not gonna use this in this project.
│
├── app.py # we use this for model training, predicting price (new prediction value every retrain), integrating prediction value to dashboard, and soon will always storing realtime data from realtime API at 12pm, and retrain the model again. Also, it will soon displaying every predictions in historical predictions ( still bug )
├── requirements.txt     # needed library
├── README.md            # Project Documentation, Description, and information
```

## 🗂 Dataset
  We use to take historical data manually, and realtime data from API.

- **SOURCE**: 
Historical : [Investing.com](https://www.investing.com/crypto/bitcoin/historical-data), 
API        : [Coingecko](https://coinmarketcap.com/currencies/bitcoin/historical-data/),

- **Format**: CSV(historical data)

- **Time Span**: Juni 2010 – 6 June 2025

- **Update**: Data real-time akan diambil setiap hari jam 12 siang dari Coingecko menggunakan WebSocket API, dan disimpan di folder `Dataset/Historical/`. ( belum bisa )

---

## How To Run This Project

1. **Clone repositori**:
   git clone https://github.com/Raihlm/CryptoPredictionsProject

   cd CryptoPredictionsProject

   pip install -r requirements.txt

   python -m uvicorn app:app --reload

pip install -r requirements.txt

python3 -m uvicorn app:app --reload


run this on terminal ( if your python ver < 3.13)

python -m uvicorn app:app --reload

```bash
### Project RunDown

DoneProgress:
✅ Gathering Historical Dataset (2010–2025)

✅ Explorating Daily, weekly, monnthly, yearly data

✅ Training Predictions model using Linear Regression And Random Forest

✅ Model Evaluation

✅ Predict next day, week, month, year price

✅ Creating dashboard using html css js

✅ Integrating model and predictions to dashboard using FastAPI

🔜 fetch realtime data to historical data

🔜 sentiment analysis ( on progress )

🔜 View Historical Predictions ( Still Bug & on progress )
```

# Purpose & Reason To Create THis project

This project created for us to learn how to build machine learning model from zero, to useful usecase.
Develop our data analyst skill, making pipieline, also training and learn how to integrate backend to frontend
Realizing a dynamic prediction system based on th realtime data
And open a chance for integrating to a financial dashboard application on the future


# Technology we use:
Python 3.13.1

Pandas, NumPy, Matplotlib, Seaborn, mplfinance – for analysis and visualizing.

Scikit-learn – for building machine learning model

WebSocket (coingecko API) – pulling realtime data


# Liscence

This project made for a learning media. Feel Free to use and modify this for non-commersial purpose, also include attribution to a creator if used.

# 👤 Project Owner
Rayhan

LinkedIn: (https://www.linkedin.com/in/muhammad-rayhan-ilhamdi-177520314?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app)

## ✅ Available Endpoints After Run

http://127.0.0.1:8000 → dashboard

http://127.0.0.1:8000/api/health → check health & loaded models

http://127.0.0.1:8000/api/prediction → check predictions price

http://127.0.0.1:8000/api/model-performance → check performance model