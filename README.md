# mojodoc

API documentation generator for Mojo🔥.

## Features

- **Beautiful Output** — Modern, dark-mode-first design with the "Inferno" theme
- **Full-Text Search** — Spotlight-style search with `⌘K` / `Ctrl+K`
- **Public API Extraction** — Parses `__init__.mojo` to highlight your library's main exports
- **Source Links** — Click `[src]` to jump to source on GitHub/GitLab
- **Triple-Quote Docstrings** — Supports standard `"""..."""` format
- **Zero Config** — Works out of the box, reads metadata from `pixi.toml`

## Installation

Add mojodoc as a dev dependency in your Mojo project's `pixi.toml`:

```toml
[workspace]
channels = ["https://conda.modular.com/max-nightly", "conda-forge"]
preview = ["pixi-build"]

[feature.dev.dependencies]
mojodoc = { git = "https://github.com/ehsanmok/mojodoc.git" }

[environments]
default = { features = ["dev"] }
```

## Usage

Generate and view documentation:

```bash
# Build docs and open in browser
pixi run mojodoc ./mypackage --open

# Build without opening browser
pixi run mojodoc ./mypackage

# Specify custom output directory
pixi run mojodoc ./mypackage --out-dir ./docs

# Use a different port (default: 3000)
pixi run mojodoc ./mypackage --open --port 8080
```

Source links are **auto-detected** from your git remote — no configuration needed.

## CLI Options

| Option | Description |
|--------|-------------|
| `-o, --open` | Start local server and open in browser |
| `-p, --port <port>` | Port for local server (default: 3000) |
| `-r, --repository <url>` | Override repository URL for source links (auto-detected from git) |
| `--out-dir <path>` | Output directory (default: `target/doc`) |
| `-v, --verbose` | Verbose output |

## Writing Docstrings

mojodoc supports Google-style docstrings in the standard triple-quote format:

```mojo
"""High-level summary of the function.

Detailed description with more context about what
this function does and when to use it.

Args:
    name: The user's name.
    age: The user's age in years.

Returns:
    A greeting message.

Raises:
    Error: If name is empty.

Example:
    ```mojo
    var greeting = greet("Alice", 30)
    print(greeting)  # Hello, Alice!
    ```
"""
fn greet(name: String, age: Int) raises -> String:
    if len(name) == 0:
        raise Error("Name cannot be empty")
    return "Hello, " + name + "!"
```

### Package Docstrings

Add a docstring at the top of your `__init__.mojo` to describe your package:

```mojo
"""My awesome library for doing cool things.

Features:
- **Fast**: Optimized for performance
- **Simple**: Easy to use API
- **Flexible**: Highly configurable

Example:
    ```mojo
    from mylib import cool_function
    var result = cool_function()
    ```
"""

from .core import cool_function
from .utils import helper
```

## Output

Documentation is generated to `target/doc/` by default:

```
target/doc/
├── mypackage/
│   ├── index.html      # Package overview + public API
│   ├── module1/
│   │   └── index.html  # Module documentation
│   └── module2/
│       └── index.html
├── assets/
│   ├── styles.css
│   └── main.js
└── search-index.json
```

## Comparison with `mojo doc`

| Feature | `mojo doc` | `mojodoc` |
|---------|------------|-----------|
| Output format | JSON | Beautiful HTML |
| Search | ❌ | ✅ Full-text with `⌘K` |
| Dark mode | ❌ | ✅ |
| Public API display | ❌ | ✅ Parses `__init__.mojo` |
| Source links | ❌ | ✅ |
| Local server | ❌ | ✅ `--open` flag |
| Package docstrings | ❌ | ✅ |

## Development

```bash
# Clone the repo
git clone https://github.com/ehsanmok/mojodoc.git
cd mojodoc

# Install dependencies
pixi run install

# Build
pixi run build

# Run tests
pixi run tests

# Format code (prettier)
pixi run format

# Lint code (eslint)
pixi run lint
pixi run lint-fix  # auto-fix issues

# Run all checks (format + lint + tests)
pixi run check

# Install pre-commit hooks
pixi run install-pre-commit

# Generate docs for a local package
pixi run mojodoc ../mypackage --open
```

## License

[MIT](./LICENSE)
