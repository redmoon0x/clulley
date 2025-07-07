# Free-Cluely: The Stealth AI Assistant

Free-Cluely is an advanced AI assistant designed for discreet use in professional environments. It floats above other applications, ready to provide instant help for software engineers through screenshots, audio analysis, and text-based interactions - all while remaining unobtrusive and easily dismissible.

The application leverages modern AI technology, specifically Google's Gemini models, to analyze inputs and generate context-aware responses. What sets Free-Cluely apart is its focus on stealth and privacy - allowing users to get AI assistance without drawing attention or disrupting their workflow.

## Key Features

- **Stealth Operation**: Frameless, transparent window with no taskbar or dock presence.
- **Multi-modal Input**: Supports screenshots, audio, and text.
- **AI-Powered Analysis**: Uses Google Gemini for intelligent responses.
- **Privacy-Focused**: No history, no logs, and secure data handling.
- **Cross-Platform**: Built with Electron for Windows, macOS, and Linux support.

## Technical Architecture

- **Frontend**: React with TypeScript
- **Backend**: Electron with Node.js
- **AI**: Google Gemini API

The application follows a multi-process architecture, with a main process for system-level tasks and a renderer process for the user interface.

## Getting Started

### Prerequisites

- Node.js and npm
- A Google Gemini API Key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/redmoon0x/clulley.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key
   ```
4. Start the application:
   ```bash
   npm start
   ```

## Usage

1. **Activation**: Use the global keyboard shortcut (customizable) to show/hide the window.
2. **Input**: Take a screenshot, record audio, or type a question.
3. **Processing**: The AI will analyze the input.
4. **Solution**: The response will be displayed in the solutions view.

## Documentation

For more detailed information, please refer to the documentation in the `docs/assets` directory:

- **[PROJECT_DOCUMENTATION.md](./docs/assets/PROJECT_DOCUMENTATION.md)**: General overview.
- **[SYSTEM_DESIGN.md](./docs/assets/SYSTEM_DESIGN.md)**: Detailed system architecture.
- **[DATA_FLOW.md](./docs/assets/DATA_FLOW.md)**: Data flow diagrams and explanations.
- **[STEALTH_FEATURES.md](./docs/assets/STEALTH_FEATURES.md)**: Comprehensive stealth implementation details.

## Contributing

Contributions are welcome! Please feel free to submit a pull request.

## License

This project is licensed under the MIT License.
