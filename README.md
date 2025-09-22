# Twig Variable Tracker (Node.js)

This project allows you to analyze Twig templates and detect which variables are accessed during rendering.
It uses JavaScript Proxies to intercept property access on variables, so you can see exactly what parts of the context are being used.

### Note: 
This project is not finished.

## Cases where it doesn't work

- Embedded JavaScript inside of Twig strings (lodashTemplate).
- Custom Twig functions/filters.

## Features

- Track variables used in a Twig template

- Handles deeply nested properties (e.g. user.address.city)

- Supports "virtual" properties (won’t throw if missing)

- Filters out unwanted/boilerplate accesses

- Works with preprocessed Twig templates

## How It Works

Twig templates are preprocessed to simplify certain constructs (loops, merges, etc.).

A tracking proxy wraps the rootVars object.

Every property access (including nested ones) is intercepted.

Accessed paths are stored in a Set and returned.

### Example

```
Hello {{ user.name }}!
You have {{ orders.0.total }} pending orders.
```

### Would produce:

```
[
  "user",
  "user.name",
  "orders",
  "orders.0",
  "orders.0.total"
]
```

## Usage
### Run Tracker
```
node server.js
```

### Example Output

```
Variables used in template: [
  'user.name',
  'orders.0.total'
]
```
