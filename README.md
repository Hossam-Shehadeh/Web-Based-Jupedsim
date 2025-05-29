
# 🚶‍♂️ Web-Based JuPedSim

> **An interactive web-based visualization tool for pedestrian dynamics simulations**

Transform complex pedestrian flow analysis into intuitive, interactive experiences. Built for urban planners, safety engineers, and researchers who need powerful simulation capabilities with an accessible interface.

## ✨ Features

### 🎨 **Interactive Design Studio**
- **Drag & Drop Interface**: Create simulation environments with intuitive drawing tools
- **Real-time Preview**: See changes instantly as you design
- **Smart Snapping**: Automatic alignment and connection of elements
- **Undo/Redo**: Full history management for design iterations

### 🏃‍♂️ **Advanced Simulation Engine**
- **Multiple Models**: Social Force, Collision-Free Speed, Centrifugal Force models
- **Real-time Visualization**: Watch pedestrians move in real-time
- **Parameter Tuning**: Fine-tune behavior with intuitive controls
- **Scenario Templates**: Pre-built scenarios for common use cases

### 📊 **Powerful Analytics**
- **Density Heatmaps**: Visualize crowd concentration patterns
- **Flow Analysis**: Understand movement directions and bottlenecks
- **Trajectory Tracking**: Follow individual pedestrian paths
- **Statistical Dashboard**: Real-time metrics and performance indicators

### 🎯 **Professional Tools**
- **Export Capabilities**: Save data in multiple formats (CSV, JSON, PNG)
- **Comparison Mode**: Compare different scenarios side-by-side
- **Report Generation**: Automated analysis reports
- **API Integration**: Programmatic access to simulation data

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Simulation    │
│  (React.js)     │◄──►│   (FastAPI)     │◄──►│   (JuPedSim)    │
│                 │    │                 │    │                 │
│ • React UI      │    │ • REST API      │    │ • Physics       │
│ • Canvas        │    │ • WebSocket     │    │ • Pathfinding   │
│ • Visualization │    │ • Data Processing│    │ • Agent Logic   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 🔄 **Data Flow**
1. **Design Phase**: User creates geometry using interactive tools
2. **Configuration**: Parameters are set through intuitive controls
3. **Simulation**: Backend processes data using JuPedSim engine
4. **Visualization**: Real-time results streamed via WebSocket
5. **Analysis**: Post-processing generates insights and reports

## 🚀 Quick Start

### 📋 Prerequisites

```bash
# System Requirements
Node.js >= 18.0.0
Python >= 3.10
Git
4GB+ RAM (8GB recommended)
```

### ⚡ One-Command Setup

```bash
# Clone and setup everything
git clone https://github.com/Hossam-Shehadeh/Web-Based-Jupedsim.git
cd Web-Based-Jupedsim
chmod +x setup.sh && ./setup.sh
```

### 🔧 Manual Setup

#### 1. **Environment Configuration**
```bash
# Create environment files
cp .env.example .env.local
cp backend/.env.example backend/.env

# Edit configuration
nano .env.local
```

#### 2. **Backend Setup**
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
python main.py
```

#### 3. **Frontend Setup**
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

#### 4. **Access Application**
- 🌐 **Frontend**: http://localhost:3000
- 🔧 **Backend API**: http://localhost:8000
- 📚 **API Docs**: http://localhost:8000/docs

## 📖 User Guide

### 🎯 **Getting Started**

1. **Load a Template**: Choose from pre-built scenarios in the sidebar
2. **Design Environment**: Use drawing tools to create your space
3. **Configure Simulation**: Set parameters in the simulation tab
4. **Run & Analyze**: Execute simulation and explore results

### 🛠️ **Drawing Tools**

| Tool | Description | Shortcut |
|------|-------------|----------|
| 🖱️ **Select** | Select and move elements | `V` |
| 🏠 **Walkable Area** | Define pedestrian spaces | `W` |
| 🚧 **Obstacle** | Create barriers and walls | `O` |
| 🚪 **Entry/Exit** | Set spawn and destination points | `E` |
| 📍 **Waypoint** | Add navigation markers | `P` |

### 🎛️ **Simulation Models**

#### **Social Force Model**
- **Best for**: Realistic crowd behavior
- **Features**: Social interactions, personal space
- **Use cases**: Shopping centers, public spaces

#### **Collision-Free Speed Model**
- **Best for**: Efficient movement simulation
- **Features**: Fast computation, smooth flow
- **Use cases**: Transit stations, corridors

#### **Centrifugal Force Model**
- **Best for**: Emergency scenarios
- **Features**: Panic behavior, force dynamics
- **Use cases**: Evacuation planning

### 📊 **Analysis Tools**

#### **Density Heatmaps**
- Visualize crowd concentration
- Identify bottlenecks and congestion
- Time-based density evolution

#### **Flow Visualization**
- Movement direction vectors
- Speed distribution analysis
- Flow rate measurements

#### **Trajectory Analysis**
- Individual path tracking
- Route efficiency metrics
- Behavioral pattern analysis

## 🔧 Development

### 📁 **Project Structure**
```plaintext
jupedsim-web/
├── app/                  # Next.js app directory
│   ├── api/              # API routes
│   ├── simulation/       # Main simulation page
│   └── globals.css       # Global styles
├── components/           # React components
│   ├── ui/               # shadcn/ui components
│   ├── canvas.tsx        # Main simulation canvas
│   ├── simulation-*.tsx  # Simulation components
│   └── visualization-*.tsx # Analysis components
├── backend/              # Python backend
│   ├── main.py           # FastAPI application
│   ├── services/         # Business logic
│   ├── models/           # Data models
│   └── tests/            # Test files
├── utils/                # Utility functions
├── types/                # TypeScript definitions
├── docs/                 # Documentation
└── scripts/              # Build and deployment scripts
```

### 🧪 **Testing**

```bash
# Frontend tests
npm run test
npm run test:watch
npm run test:coverage
npm run test:e2e

# Backend tests
cd backend
pytest
pytest --cov=backend
pytest tests/unit/
pytest tests/integration/
```

### 🎨 **Code Quality**

```bash
# Frontend
npm run lint
npm run lint:fix
npm run format
npm run type-check

# Backend
cd backend
black .
isort .
flake8 .
mypy .
```

### 🔄 **Development Workflow**

1. **Create Feature Branch**: `git checkout -b feature/amazing-feature`
2. **Write Code**
3. **Quality Check**
4. **Commit Changes**
5. **Push & PR**
6. **Code Review**
7. **Merge**

## 🚀 Deployment

### 🐳 **Docker Deployment**

```bash
docker-compose up --build
docker build -t jupedsim-frontend .
docker build -t jupedsim-backend ./backend
docker run -p 3000:3000 jupedsim-frontend
docker run -p 8000:8000 jupedsim-backend
```

### ☁️ **Cloud Deployment**

#### **Vercel (Frontend)**

```bash
npm i -g vercel
vercel --prod
```

#### **Railway/Render (Backend)**
- Connect GitHub repository
- Set environment variables
- Configure build commands
- Deploy

### 🔧 **Environment Variables**

#### **Frontend (.env.local)**
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
NODE_ENV=development
```

#### **Backend (.env)**
```bash
CORS_ORIGINS=["http://localhost:3000"]
DEBUG=true
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///./simulation.db
REDIS_URL=redis://localhost:6379
```
