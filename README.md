# Real-Time Collaborative Whiteboard

A full-stack real-time collaborative whiteboard application built with the MERN Stack (MongoDB, Express.js, React.js, Node.js). Multiple users can join shared rooms and draw simultaneously with real-time synchronization using WebSockets (Socket.io).

![Whiteboard Demo](https://img.shields.io/badge/Status-Production%20Ready-green)
![License](https://img.shields.io/badge/License-MIT-blue)

## Features

### Core Features
- ✅ **User Authentication** - JWT-based Register/Login/Logout with Google OAuth integration
- ✅ **Room Management** - Create and join whiteboard rooms via unique Room ID
- ✅ **Real-time Drawing** - Synchronized drawing using Socket.io
- ✅ **Canvas Tools** - Pencil, Eraser, Clear Board
- ✅ **Color Picker** - Full color selection with custom colors
- ✅ **Brush Size** - Adjustable brush/eraser size
- ✅ **Multi-user Collaboration** - Room-based real-time collaboration
- ✅ **Chat Feature** - In-room messaging with typing indicators
- ✅ **Persistent Storage** - Whiteboard sessions saved to MongoDB
- ✅ **Responsive UI** - Built with React Hooks and Tailwind CSS

### Intermediate Features
- ✅ **Undo/Redo** - Full history management for drawing actions
- ✅ **Save Snapshot** - Export whiteboard as PNG image
- ✅ **User Presence** - See who's online in the room with cursors
- ✅ **Protected Routes** - Route guards for authenticated users
- ✅ **Role-based Permissions** - Host vs Participant controls
- ✅ **Error Handling** - Comprehensive error handling and validation

### Advanced Features
- ✅ **Screen Sharing** - WebRTC-based screen sharing
- ✅ **File Sharing** - Share files within the room chat
- ✅ **Dark/Light Mode** - Toggle between themes with persistence
- ✅ **Remote Cursors** - See other users' cursor positions in real-time
- ✅ **Room Settings** - Host can control room permissions

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js 5
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + Passport.js (Google OAuth 2.0)
- **Real-time**: Socket.io
- **Security**: bcryptjs for password hashing

### Frontend
- **Framework**: React 19 with Vite
- **Styling**: Tailwind CSS 4
- **Routing**: React Router DOM 7
- **State Management**: React Context API
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Real-time Client**: Socket.io Client

## Project Structure

```
Collaborative_whiteboard/
├── backend/
│   ├── config/
│   │   ├── database.js          # MongoDB connection
│   │   └── passport.js          # Google OAuth configuration
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── roomController.js    # Room management
│   │   ├── whiteboardController.js  # Whiteboard operations
│   │   └── chatController.js    # Chat functionality
│   ├── middleware/
│   │   └── auth.js              # JWT authentication middleware
│   ├── models/
│   │   ├── User.js              # User schema
│   │   ├── Room.js              # Room schema
│   │   ├── Whiteboard.js        # Whiteboard schema
│   │   └── Message.js           # Chat message schema
│   ├── routes/
│   │   ├── auth.js              # Auth routes
│   │   ├── room.js              # Room routes
│   │   └── whiteboard.js        # Whiteboard routes
│   ├── socket/
│   │   └── socketHandler.js     # Socket.io event handlers
│   ├── server.js                # Main entry point
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Canvas.jsx           # Drawing canvas component
│   │   │   ├── Toolbar.jsx          # Drawing tools toolbar
│   │   │   ├── ChatPanel.jsx        # Chat sidebar
│   │   │   ├── ParticipantsPanel.jsx # User list panel
│   │   │   ├── ScreenShare.jsx      # Screen sharing component
│   │   │   └── ProtectedRoute.jsx   # Route guard
│   │   ├── context/
│   │   │   ├── AuthContext.jsx      # Authentication state
│   │   │   ├── SocketContext.jsx    # Socket.io state
│   │   │   └── ThemeContext.jsx     # Dark/Light mode state
│   │   ├── pages/
│   │   │   ├── Login.jsx            # Login page
│   │   │   ├── Register.jsx         # Registration page
│   │   │   ├── Dashboard.jsx        # Room management
│   │   │   ├── WhiteboardRoom.jsx   # Main whiteboard page
│   │   │   └── AuthCallback.jsx     # OAuth callback handler
│   │   ├── services/
│   │   │   ├── api.js               # Axios instance
│   │   │   └── roomService.js       # API service functions
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── .env
│
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js 18+ installed
- MongoDB database (local or Atlas)
- Google Cloud Console project for OAuth (optional)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `.env`:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   PORT=3500
   JWT_SECRET=your_jwt_secret_key
   SESSION_SECRET=your_session_secret
   CLIENT_URL=http://localhost:5173
   NODE_ENV=development
   
   # Google OAuth (optional)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

4. Start the backend server:
   ```bash
   # Development with hot reload
   npm run dev
   
   # Production
   npm start
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `.env`:
   ```env
   VITE_API_URL=http://localhost:3500/api
   VITE_SOCKET_URL=http://localhost:3500
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser at `http://localhost:5173`

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/password` | Change password |
| GET | `/api/auth/google` | Google OAuth login |
| GET | `/api/auth/google/callback` | Google OAuth callback |

### Rooms
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rooms` | Create new room |
| POST | `/api/rooms/join` | Join a room |
| GET | `/api/rooms/my-rooms` | Get user's rooms |
| GET | `/api/rooms/:roomId` | Get room details |
| PUT | `/api/rooms/:roomId` | Update room |
| POST | `/api/rooms/:roomId/leave` | Leave room |
| DELETE | `/api/rooms/:roomId` | Delete room |

### Whiteboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/whiteboard/:roomId` | Get whiteboard data |
| POST | `/api/whiteboard/:roomId/strokes` | Save strokes |
| POST | `/api/whiteboard/:roomId/clear` | Clear whiteboard |
| POST | `/api/whiteboard/:roomId/undo` | Undo last stroke |
| POST | `/api/whiteboard/:roomId/snapshot` | Save snapshot |
| GET | `/api/whiteboard/:roomId/snapshots` | Get snapshots |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rooms/:roomId/messages` | Get messages |
| POST | `/api/rooms/:roomId/messages` | Send message |
| DELETE | `/api/rooms/messages/:messageId` | Delete message |

## Socket.io Events

### Client → Server
| Event | Description |
|-------|-------------|
| `join-room` | Join a whiteboard room |
| `leave-room` | Leave current room |
| `draw-start` | Begin drawing stroke |
| `draw-move` | Continue drawing |
| `draw-end` | End drawing stroke |
| `clear-board` | Clear whiteboard (host only) |
| `undo` | Undo last stroke |
| `chat-message` | Send chat message |
| `typing-start` | Start typing indicator |
| `typing-stop` | Stop typing indicator |
| `cursor-move` | Update cursor position |
| `screen-share-offer` | WebRTC screen share offer |
| `screen-share-answer` | WebRTC screen share answer |
| `ice-candidate` | WebRTC ICE candidate |

### Server → Client
| Event | Description |
|-------|-------------|
| `room-joined` | Confirmation of room join |
| `user-joined` | New user joined |
| `user-left` | User left room |
| `active-users` | Updated user list |
| `draw-start/move/end` | Remote drawing events |
| `board-cleared` | Board was cleared |
| `strokes-updated` | Strokes state updated |
| `chat-message` | New chat message |
| `user-typing` | User typing indicator |
| `cursor-move` | Remote cursor position |
| `settings-updated` | Room settings changed |

## Environment Variables

### Backend
| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `PORT` | Server port (default: 3500) | No |
| `JWT_SECRET` | JWT signing secret | Yes |
| `SESSION_SECRET` | Session secret | Yes |
| `CLIENT_URL` | Frontend URL | Yes |
| `NODE_ENV` | Environment mode | No |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | No |

### Frontend
| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL | Yes |
| `VITE_SOCKET_URL` | Socket.io server URL | Yes |

## Deployment

### Backend Deployment (Heroku/Railway/Render)

1. Set all environment variables in your platform's dashboard
2. Ensure `MONGODB_URI` points to a production MongoDB instance
3. Update `CLIENT_URL` to your deployed frontend URL
4. Deploy using platform-specific instructions

### Frontend Deployment (Vercel/Netlify)

1. Build the production bundle:
   ```bash
   npm run build
   ```

2. Set environment variables:
   - `VITE_API_URL` → Your deployed backend URL
   - `VITE_SOCKET_URL` → Your deployed backend URL

3. Deploy the `dist` folder

### Google OAuth Configuration

For production deployment, update your Google Cloud Console:
1. Add your production callback URL: `https://your-backend.com/api/auth/google/callback`
2. Add your production frontend URL to authorized origins

## Usage Guide

### Creating a Room
1. Login or register an account
2. Click "Create Room" on the dashboard
3. Enter a room name
4. Optionally set a password for private rooms
5. Share the Room ID with collaborators

### Joining a Room
1. Click "Join Room" on the dashboard
2. Enter the Room ID
3. Enter password if required
4. Start collaborating!

### Drawing Tools
- **Pencil**: Freehand drawing
- **Eraser**: Erase parts of the drawing
- **Color Picker**: Choose drawing color
- **Brush Size**: Adjust line thickness
- **Undo/Redo**: Navigate drawing history
- **Clear Board**: Remove all drawings (host only)
- **Save Snapshot**: Export as PNG image

### Room Controls (Host Only)
- Enable/disable participant drawing
- Enable/disable chat
- Enable/disable screen sharing
- Enable/disable file sharing
- Kick participants

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- [Socket.io](https://socket.io/) for real-time communication
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Lucide Icons](https://lucide.dev/) for beautiful icons
- [MongoDB](https://www.mongodb.com/) for database
