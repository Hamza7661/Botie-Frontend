# 📋 Botie - Appointment Management App

A modern, responsive appointment management application built with React Native and Expo. Botie helps users efficiently manage their appointments, customer information, and professional services.

## ✨ Features

### 🔐 Authentication & User Management
- **Secure Registration & Login**: Email-based authentication with JWT tokens
- **Profile Management**: Update personal information, profession details, and contact info
- **Password Management**: Forgot password and reset functionality
- **User Profiles**: Professional profiles with address, profession, and description

### 📅 Appointment Management
- **Create & Edit Appointments**: Full CRUD operations for appointments
- **Customer Information**: Store and manage customer details (name, phone, address)
- **Status Tracking**: Mark appointments as resolved or unresolved
- **Search & Filter**: Find appointments quickly with search functionality
- **Pagination**: Efficient loading with pagination support

### 🎨 Modern UI/UX
- **Responsive Design**: Works seamlessly on mobile and tablet devices
- **Material Design**: Clean, modern interface using React Native Paper
- **Dark/Light Theme Support**: Consistent theming throughout the app
- **Loading States**: Smooth loading indicators and skeleton screens
- **Toast Notifications**: User-friendly feedback messages

### 🔧 Technical Features
- **Real-time Updates**: Immediate UI updates after data changes
- **Offline Support**: Graceful handling of network issues
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Form Validation**: Client-side validation with helpful error messages
- **Navigation**: Smooth navigation between screens

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Expo CLI** (`npm install -g @expo/cli`)
- **Expo Go** app on your mobile device (for testing)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd botie-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # API Base URL
   EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/api
   
   # Google Places API Key (for location search and autocomplete)
   EXPO_PUBLIC_GOOGLE_API_KEY=your_google_places_api_key_here
   ```

4. **Start the development server**
   ```bash
   npx expo start
   ```

5. **Run on your device**
   - Scan the QR code with Expo Go (Android) or Camera app (iOS)
   - Or press `a` for Android emulator or `i` for iOS simulator

## 📱 App Structure

```
src/
├── components/          # Reusable UI components
│   └── Preloader.js    # Loading component
├── context/            # React Context providers
│   └── AuthContext.js  # Authentication state management
├── screens/            # App screens
│   ├── LoginScreen.js
│   ├── RegisterScreen.js
│   ├── DashboardScreen.js
│   ├── ProfileScreen.js
│   ├── AppointmentDetailScreen.js
│   ├── AddEditAppointmentScreen.js
│   ├── ForgotPasswordScreen.js
│   └── ResetPasswordScreen.js
├── services/           # API services
│   └── api.js         # HTTP client and API endpoints
├── styles/            # Global styles
│   └── global.css
└── utils/             # Utility functions
    ├── toast.js       # Toast notification utility
    └── validation.js  # Form validation helpers
```

## �� Configuration

### Environment Variables

For deployment, you need to set up environment variables:

#### Local Development
Create a `.env` file in the root directory:
```env
# Public URL for static site deployment
RENDER_EXTERNAL_URL=https://your-app-name.onrender.com

# API Base URL
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/api

# Google Places API Key (for location search and autocomplete)
EXPO_PUBLIC_GOOGLE_API_KEY=your_google_places_api_key_here
```

#### Render Deployment
In your Render dashboard, set these environment variables:
- `RENDER_EXTERNAL_URL`: Your Render app URL (e.g., `https://your-app-name.onrender.com`)
- `EXPO_PUBLIC_API_BASE_URL`: Your production API URL
- `EXPO_PUBLIC_GOOGLE_API_KEY`: Your Google Places API key

### Google Places API Setup

The app uses Google Places API for location search and autocomplete functionality in the reminder screen. To set this up:

1. **Get a Google Places API Key**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the "Places API" and "Maps JavaScript API"
   - Create credentials (API Key)
   - Restrict the API key to your domain for security

2. **Add the API Key**:
   - Add `EXPO_PUBLIC_GOOGLE_API_KEY=your_api_key_here` to your `.env` file
   - For production, add the same environment variable to your deployment platform

3. **Features Enabled**:
   - Location search with autocomplete using Google Places API
   - Address suggestions and place details
   - Automatic coordinate extraction
   - Dynamic country detection based on user's location
   - Results automatically restricted to user's current country

4. **Testing Your Setup**:
   - The app will log Google Places API status to the console on startup
   - You can temporarily add the `GooglePlacesTest` component to any screen to test functionality
   - Check the browser console or React Native debugger for detailed status information

### API Configuration

The app connects to a backend API. Update the API base URL in your environment variables:

```javascript
// src/services/api.js
const API_BASE_URL = Constants.expoConfig.extra.apiBaseUrl;
```

## 📋 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `PUT /api/auth/changepassword` - Change password
- `POST /api/auth/forgotpassword` - Forgot password
- `PUT /api/auth/resetpassword/:token` - Reset password

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Delete user account

### Appointments/Tasks
- `GET /api/tasks` - Get appointments with pagination
- `GET /api/tasks/:id` - Get appointment details
- `POST /api/tasks` - Create new appointment
- `PUT /api/tasks/:id` - Update appointment
- `DELETE /api/tasks/:id` - Delete appointment

## 🎨 UI Components

### Core Components
- **Card**: Consistent card layouts throughout the app
- **Button**: Material Design buttons with loading states
- **TextInput**: Form inputs with validation and error states
- **Searchbar**: Search functionality with debouncing
- **FAB**: Floating Action Button for quick actions

### Custom Components
- **Preloader**: Loading overlay component
- **StatusBadge**: Appointment status indicators
- **Pagination**: Page navigation controls

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Validation**: Strong password requirements
- **Input Sanitization**: Client-side validation and sanitization
- **Error Handling**: Secure error messages without exposing sensitive data

## 📱 Platform Support

- **iOS**: Full support with native iOS components
- **Android**: Full support with Material Design components
- **Web**: Responsive web support (if needed)
- **Tablet**: Optimized layouts for larger screens

## 🛠️ Development

### Available Scripts

```bash
# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on web
npm run web

# Build for production
npm run build

# Eject from Expo
npm run eject
```

### Code Style

The project follows React Native best practices:
- **Functional Components**: Using React hooks
- **Context API**: For state management
- **Custom Hooks**: For reusable logic
- **Component Composition**: For flexible UI components

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📦 Dependencies

### Core Dependencies
- **React Native**: Mobile app framework
- **Expo**: Development platform and tools
- **React Navigation**: Navigation library
- **React Native Paper**: Material Design components
- **Axios**: HTTP client for API calls

### Development Dependencies
- **@babel/core**: JavaScript compiler
- **@expo/cli**: Expo command line tools
- **@react-native-async-storage/async-storage**: Local storage
- **expo-linear-gradient**: Gradient backgrounds
- **react-native-paper**: UI component library

## 🚀 Deployment

### Building for Production

1. **Configure app.json**
   ```json
   {
     "expo": {
       "name": "Botie",
       "slug": "botie-app",
       "version": "1.0.0",
       "platforms": ["ios", "android"]
     }
   }
   ```

2. **Build the app**
   ```bash
   # For Android
   expo build:android

   # For iOS
   expo build:ios
   ```

3. **Submit to stores**
   - Follow Expo's deployment guide for app store submission

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page for existing solutions
2. Create a new issue with detailed information
3. Contact the development team

## 🙏 Acknowledgments

- **Expo Team**: For the amazing development platform
- **React Native Paper**: For the beautiful UI components
- **React Navigation**: For the smooth navigation experience

---

**Made with ❤️ by the Botie Team** 