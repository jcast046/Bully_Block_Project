# -> [Bully_Block_Website](https://jcast046.github.io/Bully_Block_Website/) <-
# Team Silver

## Team Members
- **Joshua Castillo** - jcast046@odu.edu // Github: jcast046  
- **Jacob Braley** - jbral001@odu.edu // GitHub: JayBraley  
- **Reagan McCoy** - rmcco008@odu.edu // Github: rmcco008  
- **Skyler Williams** - swill168@odu.edu // Github: SWilliamsGit & CSswill168  
- **Nomar Rodriguez** - nrodr015@odu.edu // GitHub: Nrodr015  
- **Trevor Newberry** - tnewb003@odu.edu // GitHub: trevornewberry  
- **Peter Spadaro** - pspad001@odu.edu // GitHub: PeterSpadaro  


## Overview
The **Cyberbullying Detection System** is a web application designed to enhance the safety and educational quality of K-12 public schools by integrating directly with the Canvas Learning Management System (**LMS**). By using a robust Natural Language Processing (**NLP**) pipeline, this system monitors and analyzes online communications in real time, alerting stakeholders to potential cyberbullying incidents.

## Features
- **Automatic Alerts:** Immediate notifications for suspected cyberbullying incidents to ensure rapid response by designated staff.  
- **Comprehensive Dashboard:** A user-friendly interface for viewing, reviewing, and managing potential incidents and alerts.  
- **Immediate Linkage to Security Personnel:** Direct communication channels to school security staff to quickly address and manage incidents.


## Technologies Used

### Frontend
- **React**  
  - Provides a dynamic and responsive dashboard for real-time alerts and analytics.
- **Running the Frontend** 
  - cd into bullyblock-dashboard
  - Install dependencies with: npm install
  - Start the app with: npm start
      - runs the app in development mode
  - Run tests with: npm test
      - launches the test runner
  - Build the app with: npm run build
      - builds the app for production to the build folder
  - Eject the app with: npm run eject
      - copies configuration files and dependencies into the project

### Backend
- **Node.js with Express**  
  - The backend is built with Node.js and Express, which handles routing, API logic, and real-time data processing.
  - The server provides RESTful API endpoints for managing: users, schools, incidents, posts, comments, and alerts.
  - Middleware is implemented for security (xss-clean for sanitization, a custom sanitizeMiddleware), CORS handling, and JSON parsing.
  - HTTPS support is available, configurable via environment variables for SSL key and certificate paths.
  - The server includes a health check endpoint (/) to confirm service availability.
  - The backend fetches data from the Canvas LMS API only right before AI model training begins, if a valid CANVAS_ACCESS_TOKEN is provided.
  - The backend launches pytorch_model_training.py 30 seconds after server start, and continues training the model periodically every 6 minutes thereafter.
  - After each model training completes, the backend automatically uploads all participant, discussion, incident, and image data to the MongoDB.
 
- **Running the Backend**
- To start the backend server:
  - Before starting the backend, ensure that the AI dependencies, Node.js and npm are installed.
    
  - In addition A .env file is required for environment variables. It should follow this format:
      - JWT_SECRET=BullyBlockKey
      - PORT=3001
      - USE_HTTPS=false
      - SSL_KEY_PATH=./config/server.key
      - SSL_CERT_PATH=./config/server.cert
      - MONGO_URI=mongodb+srv://yourMongoDBUriHere
      - CANVAS_ACCESS_TOKEN=yourCanvasAccessTokenHere
      - EMAIL=yourEmailHere
      - PASSWORD=yourPasswordHere
 
  - The backend also requires SSL certificate and key files (server.cert and server.key) for secure communication over HTTPS, which should be placed under the config folder in the root of your project.
  - Afterwards run the command 'cd Backend' 
  - Then run the command 'npm install ...'  # Ensures dependencies like Express, Mongoose and Axios are installed.
  - Finally run 'npm start' to start the application.
    
### Database
- **MongoDB Atlas**  
  - The application uses MongoDB Atlas, a cloud-hosted NoSQL database, for scalability and offsite data storage.
  - Mongoose is used to define schemas and interact with MongoDB efficiently.
  - Stores data for:
    - Users (authentication, role-based access)
    - Schools (institution details)
    - Incidents (cyberbullying reports and related information)
    - Posts, and Comments (tracking interactions for analysis)
    - Alerts (notifications about potential cyberbullying incidents)
  - The backend connects to MongoDB Atlas using credentials stored in environment variables (MONGO_URI).
  - If the database connection fails, the server logs an error and exits to prevent operating in a broken state.

### Artificial Intelligence, NLP, Deep Learning, and Machine Learning
- **Python**  
  - Used for data preprocessing, feature extraction, and model training pipelines.
- **NLTK** (Natural Language Toolkit)  
  - Handles tokenization, stop word removal, and some basic normalization tasks.
- **spaCy**  
  - Used for more advanced linguistic processing such as lemmatization, Named Entity Recognition (NER), and Part-of-Speech (POS) tagging.
- **TF-IDF (Term Frequency–Inverse Document Frequency)**  
  - Transforms raw text into numerical feature vectors for both traditional ML and DL models.
- **scikit-learn**  
  - Offers classical machine learning algorithms, cross-validation, and hyperparameter tuning via GridSearchCV.
- **TensorFlow (Keras)**  
  - Implements deep learning architectures (CNNs, LSTMs) with dropout, spatial dropout, and learning-curve visualizations.
- **PyTorch**  
  - Provides alternative CNN and LSTM implementations using tokenized text (for embeddings) or TF-IDF vectors, employing batch normalization and dropout layers.
- **Running the AI and Machine Learning Engine**
  - **Installations:**
    - Install a Python version from 3.9 to 3.12 
    - pip install nltk spacy
    - pip install pandas matplotlib
    - pip install numpy scikit-learn tensorflow
    - pip install torch torchvision torchaudio
    - Link to download PyTorch: https://pytorch.org/
    - python -m spacy download en_core_web_sm
    - python -m nltk.downloader stopwords
    - python -m nltk.downloader vader_lexicon
  - Run pytorch_model_training.py
    - This also runs text_cleaning.py, feature_extraction.py, and tensorflow_scikit_model_training.py
    - **text_cleaning.py:** Read and cleans incoming data by converting the text to lowercase, removing punctation, and stemming. Outputs the cleaned data to the created file processed_data.json.
    - **feature_extrtaction.py:** Analyzes cleaned text from processed_data.json by identifing parts of speech in the text, assigning a sentiment score based on positive, negative, and neutral words found in the text, and assigning it a security_level of low, medium or high. Produces two output files, with featured_data.json listing the part of speech associated with each word, along with a breakdown of the sentiment analysis and the security_level for each dataset. The other output file, incident_reports.json, outputs the necessary data in a format that matches the database.
    - **tensorflow_scikit_model_training.py:** Trains two Tensorflow deep machine learning models, LSTM and CNN, with extracted features from the datasets. Outputs the accuracy of each model in each of their 5 epochs and also an overall accurracy.
    - **pytorch_model_training.py:** Trains two PyTorch deep machine learning models, LSTM and CNN, with extracted features from the datasets. Outputs the accuracy of each model in each of their 5 epochs and also an overall accuracy.

### Build & Integration Tools
- **Webpack**  
  - Bundles and optimizes frontend assets.
- **Babel**  
  - Transpiles modern JavaScript for compatibility with a range of browsers.
