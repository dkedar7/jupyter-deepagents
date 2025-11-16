# jupyter-deepagents

A JupyterLab extension that provides a chat interface for DeepAgents AI agents.

## Features

- Chat interface accessible from the right sidebar
- Integration with DeepAgents
- Support for streaming responses
- Agent can manipulate notebooks and files through the chat interface

## Requirements

- JupyterLab >= 4.0.0
- Python >= 3.8
- LangGraph (or other agent framework)

## Installation

### Development install

```bash
# Step 1: Install JavaScript dependencies
jlpm install

# Step 2: Build TypeScript code
jlpm build

# Step 3: Install package in development mode
pip install -e . --no-build-isolation

# Step 4: Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite

# Step 5: Enable server extension
jupyter server extension enable jupyter_deepagents
```

**Important:** Install JavaScript dependencies and build TypeScript before running pip install.

You can watch the source directory and run JupyterLab at the same time in different terminals to watch for changes:

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
jlpm watch

# Run JupyterLab in another terminal
jupyter lab
```

## Usage

1. Configure your agent in `my_agent.py`
2. Click the chat icon in the right sidebar to open the chat interface
3. Type your message and press Enter or click Send
4. The agent will process your request and respond in the chat

## Agent Integration

### Option 1: Default (my_agent.py)

Create a file named `my_agent.py` in your working directory:

```python
from langgraph import StateGraph  # or your preferred agent framework

# Your agent definition
agent = StateGraph(...)
# ... agent configuration

# Export as 'agent' or 'graph'
agent = compiled_graph
```

### Option 2: Custom Location (Environment Variable)

Set the `JUPYTER_AGENT_PATH` environment variable to specify a custom module and variable:

```bash
export JUPYTER_AGENT_PATH="path.to.module:variable_name"
jupyter lab
```

**Example:**
```bash
# If your agent is in custom_agent.py as 'my_graph'
export JUPYTER_AGENT_PATH="custom_agent:my_graph"
jupyter lab

# If your agent is in a package: src/agents/main.py as 'agent'
export JUPYTER_AGENT_PATH="src.agents.main:agent"
jupyter lab
```

The format is: `module_path:variable_name`
- `module_path`: Python import path (e.g., `my_agent` or `package.module`)
- `variable_name`: Name of the agent variable in the module

See [AGENT_CONFIGURATION.md](AGENT_CONFIGURATION.md) for detailed configuration options.

Make sure your agent has the necessary tools configured for notebook and file manipulation.
