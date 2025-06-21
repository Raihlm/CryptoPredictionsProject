#  Crypto Price Predictor with Real-Time Updates

Sebuah proyek pembelajaran machine learning dan data engineering yang bertujuan untuk memprediksi harga Bitcoin secara harian, bulanan, tahunan, dan memprediksi arah candlestick (naik/turun) dengan integrasi data real-time dari Binance API.

-----------------------------------------------------------------------------------------------------------------------------

# Project Description

Proyek ini dibangun sebagai bagian dari pembelajaran tentang penerapan nyata machine learning dalam dunia finansial, khususnya pada pasar cryptocurrency. Tujuan utamanya adalah membangun sistem prediksi harga Bitcoin yang:

- Menggunakan data historis dari tahun 2010 hingga 2025.
- Mengambil data real-time harian secara otomatis dari API Coinngecko setiap pukul 12 siang.
- Memprediksi harga harian, mingguan, bulanan, dan tahunan.

This project built as part of learning about how we could apply machine learning model in financial industry and learn about cryptocurrency.   

-----------------------------------------------------------------------------------------------------------------------------

# Main Feature
- Predict next day price (main Features)
- we predict next week, month, year based on the next day price prediction * some np.random for estimating technique and because our model has it weak on predicting a long time.
- the dashboard integrate realtime price from coingecko that update every 1 minute
- visualitation of historical data with candlestick and line charts
- confidence(from R Square * 100), and model evaluation.
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
│   ├── static/   
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
   git clone https://github.com/username/crypto-price-predictor.git
   cd crypto-price-predictor
Install semua dependensi:

bash
Copy
Edit
pip install -r requirements.txt

run this on terminal ( if your python ver < 3.13)
python -m uvicorn app:app --reload

```bash
# Project RunDown

DoneProgress:
✅ Mengumpulkan dataset historis (2010–2025)

✅ Explorating Daily, weekly, monnthly, yearly data

✅ Training Predictions model using Linear Regression And Random Forest

✅ Model Evaluation

✅ Implementasi pengambilan data real-time otomatis

✅ Predict next day, week, month, year price

✅ Creating dashboard using html css js

✅ Integrating model and predictions to dashboard using FastAPI

🔜 fetch realtime data to historical data

🔜 sentiment analysis ( on progress )

```

# Purpose & Reason To Create THis project

This project created for us to learn how to build machine learning model from zero, to useful usecase.
Develop our data analyst skill, making pipieline, also training and learn how to integrate backend to frontend
Realizing a dynamic prediction system based on th realtime data
And open a chance for integrating to a financial dashboard application on the future


# Technology we use:
Python

Pandas, NumPy, Matplotlib, Seaborn – untuk analisis dan visualisasi

Scikit-learn – untuk model machine learning dasar

WebSocket (coingecko API) – untuk streaming harga real-time


# Liscence

This project made for a learning media. Feel Free to use and modify this for non-commersial purpose, also include attribution to a creator if used.

# 👤 Project Owner
Rayhan
LinkedIn: (https://www.linkedin.com/in/muhammad-rayhan-ilhamdi-177520314?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app)



-----------------------------------------------------------------------------------------------------------------------------
--------- run app -----------

if python vers 3.13
run this on terminal
python3 -m uvicorn app:app --reload