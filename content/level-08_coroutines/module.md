---
id: L08
level: 8
title: Coroutines and Tasks
slug: Coroutines-and-Tasks
accent: "#f78fb3"
audience: intermediate
hours: 40
python_min: "3.8"
python_tested: "3.12"
outcomes:
  - Write an async def and run it with asyncio.run
  - Wait for two tasks with asyncio.gather
  - Tell a coroutine object from the value it returns
  - Name the docs page for tasks and timeouts
project: "Two tiny coroutines gathered into one result"
sources:
  - {id: asyncio, title: "Python docs: asyncio", url: "https://docs.python.org/3/library/asyncio.html"}
  - {id: asyncio-task, title: "Python docs: Coroutines and Tasks", url: "https://docs.python.org/3/library/asyncio-task.html"}
---
# Coroutines and Tasks

## asyncio.run drives one coroutine

`async def` defines a coroutine. Calling it does not run the body; it returns a coroutine object. `asyncio.run` creates an event loop, runs that coroutine, and closes the loop.

```python run
import asyncio

async def ping():
    return "pong"

print(asyncio.run(ping()))
```

## gather waits for more than one

`asyncio.gather` schedules the awaitables together and returns their results in order. The tasks page in the docs covers `gather`, cancellation, and timeouts.

```python run
import asyncio

async def add(a, b):
    return a + b

async def main():
    return await asyncio.gather(add(1, 2), add(3, 4))

print(asyncio.run(main()))
```

## A coroutine is not the result

Printing the coroutine object without awaiting it does not print the return value. This sample closes it so the build does not warn about a coroutine that was never awaited.

```python run
async def ping():
    return "pong"

coro = ping()
print(type(coro).__name__)
coro.close()
```

## Check yourself

1. What does calling an `async def` return before you await it?
2. What does `asyncio.gather` preserve about order?
3. Which docs page describes `create_task` and timeouts?
