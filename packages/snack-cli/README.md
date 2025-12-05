# snack-cli

CLI for creating and managing Expo Snacks from your local file system.

## Features

- **Local Development**: Create Snacks from your local files.
- **File Watching**: Automatically updates the Snack when files change.
- **Online Mode**: Automatically sets the Snack to online mode, making it available in Expo Go and the web player.
- **Runtime Logs**: Streams logs (`console.log`, `console.error`, etc.) from connected clients to your terminal.

## Usage

### Development

To use the CLI during development, you can create an alias to the built script:

```bash
# Build the package first
yarn workspace snack-cli build

# Create an alias (replace /absolute/path/to with your actual path)
alias snack-cli-dev='/absolute/path/to/expo/snack/packages/snack-cli/build/index.js'

# Run the CLI
snack-cli-dev start
```

### Commands

#### `start`

Starts a Snack from the current directory.

```bash
snack-cli-dev start
```

Options:
- `SNACK_SESSION_SECRET`: Set this environment variable to your Expo session secret to save Snacks to your account.

### Debugging

To see verbose logs from the CLI, set the `DEBUG` environment variable:

```bash
DEBUG=snack-cli snack-cli-dev start
```
