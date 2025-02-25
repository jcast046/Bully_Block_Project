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
- **Directions** 
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
  - The server provides RESTful API endpoints for managing users, schools, incidents, messages, posts, comments, and alerts.
  - Middleware is used for security (xss-clean for sanitization, a custom sanitizeMiddleware), CORS handling, and JSON parsing.
  - HTTPS support is available, configurable via environment variables for SSL key and certificate paths.
  - The server includes a health check endpoint (/) to confirm service availability.
  - The backend fetches data from the Canvas LMS API at startup and refreshes it every 5 minutes, if a valid CANVAS_ACCESS_TOKEN is provided.
 
- **Running the Backend**
To start the backend server:
  - Before starting the backend, ensure that Node.js and npm are installed.
  - cd Backend
  - npm install  # Ensures dependencies like Express and Mongoose are installed
  - npm start
    
### Database
- **MongoDB Atlas**  
  - The application uses MongoDB Atlas, a cloud-hosted NoSQL database, for scalability and offsite data storage.
  - Mongoose is used to define schemas and interact with MongoDB efficiently.
  - Stores data for:
    - Users (authentication, role-based access)
    - Schools (institution details)
    - Incidents (cyberbullying reports and related information)
    - Messages, Posts, and Comments (tracking interactions for analysis)
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

### Build & Integration Tools
- **Webpack**  
  - Bundles and optimizes frontend assets.
- **Babel**  
  - Transpiles modern JavaScript for compatibility with a range of browsers.
