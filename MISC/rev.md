# THM Room: windows x64 assembly

## task2: Number Systems

What is 0xA in decimal?
10

What is decimal 25 in hexadecimal? Include the prefix for hexadecimal.
0x19

## task3: bits and bytes

How many bytes is a WORD?
2

How many bits is a WORD?
16

## task4: binary operations

What is the result of the binary operation: 1011 AND 1100?
1000

What is the result of the binary operation: 1011 NAND 1100? Include leading zeroes.
0111

## task5: registers

How many bytes is RAX?
8

How many bytes is EAX?
4

## task6: instructions

What instruction returns from a function?
ret

What instruction will call/execute a function?
call

What instruction could be used to save a register in a way that it can later be restored?
push

## task7: flags

If two equal values are compared to each other, what will ZF be set to as result of the comparison?
1


## task8: calling conventions

In fastcall, what 64-bit register will hold the return value of a function?
RAX

In fastcall, what register is the first function parameter passed in?
RCX


## task9: memory layout

In what order is data taken off of or put onto the stack? Provide the acronym.
LIFO



# Bit-0-Asm-4

Can you figure out what is in the eax register? Put your answer in the picoCTF flag format: picoCTF{n} where n is the contents of the eax register in the decimal number base. If the answer was 0x11 your flag would be picoCTF{17}.

Download the assembly dump here
.

Hint: 
Don't tell anyone I told you this, but you can solve this problem without understanding the compare/jump relationship.

Of course, if you're really good, you'll only need one attempt to solve this problem.


## solve

- `mov DWORD PTR [rbp-0x4], 0x9fe1a`
The local variable at `[rbp-0x4]` is initialized to `0x9fe1a`

- `cmp DWORD PTR [rbp-0x4], 0x2710`
Compares `0x9fe1a` with `0x2710`

- `jle 0x55555555514e <main+37>`
Since `0x9fe1a` is greater than `0x2710`, jle is not taken. Execution continues to line <+31>

- `sub DWORD PTR [rbp-0x4], 0x65`
Subtract `0x65` from the value at `[rbp-0x4]`

`0x9fe1a - 0x65 = 0x9fdb5`

- `jmp 0x555555555152 <main+41>`
Jumps directly over line <+37> to line <+41>

- `mov eax, DWORD PTR [rbp-0x4]`
Loads the updated value 0x9fdb5 into the eax register.


0x9fdb5 in decimal is 654773

## flag:
```
picoCTF{654773}

```


# Gatekeeper
What’s behind the numeric gate? You only get access if you enter the right kind of number. You can download the program file here
.

## solve
- opened the binary in ghidra and decompiled the main func

```c
  if (local_40 < 1000) {
    puts("Too small.");
  }
  else if (local_40 < 10000) {
    if ((int)sVar2 == 3) {
      reveal_flag();
    }
    else {
      puts("Access Denied.");
    }
  }
  else {
    puts("Too high.");
  }
```

theres no decimal thats 3 digits and >1000 so we send a hex payload

```
  nc green-hill.picoctf.net 54393
Enter a numeric code (must be > 999 ): 3E8
Access granted: }4cdftc_oc_ip6f47ftc_oc_ipa_99ftc_oc_ip9_TGftc_oc_ip_xehftc_oc_ip_tigftc_oc_ipid_3ftc_oc_ip{FTCftc_oc_ipocipftc_oc_ip
```

- decompiling the reveal_flag function gives the obsfucation logic

```c
      while (local_24 = local_24 - 1, -1 < (int)local_24) {
        putchar((int)*(char *)((long)__ptr + (long)(int)local_24));
        if ((local_24 & 3) == 0) {
          printf("ftc_oc_ip");
        }
      }
```

python script to find the clean flag

```python
fflag = "}4cdftc_oc_ip6f47ftc_oc_ipa_99ftc_oc_ip9_TGftc_oc_ip_xehftc_oc_ip_tigftc_oc_ipid_3ftc_oc_ip{FTCftc_oc_ipocipftc_oc_ip"

revflag = fflag.replace("ftc_oc_ip", "")

flag = revflag[::-1]

print(flag)
# Output: picoCTF{3_digit_hex_GT_999_a74f6dc4}
```


## Flag:
```
picoCTF{3_digit_hex_GT_999_a74f6dc4}
```


# perplexed

## solve

- decompiled code shows that check() expects a 27-character input and compares sequentially with local_58 of length 23 

- The local_58 array holds 23 bytes:
`[-0x1f, -0x59, 0x1e, -8, 'u', '#', '{', 'a', -0x47, -99, -4, 'Z', '[', -0x21, 'i', 0xd2, -2, 0x1b, -0x13, -0xc, -0x13, 'g', -0xc]`

- Converted to unsigned 8-bit hex representation:
`[0xE1, 0xA7, 0x1E, 0xF8, 0x75, 0x23, 0x7B, 0x61, 0xB9, 0x9D, 0xFC, 0x5A, 0x5B, 0xDF, 0x69, 0xD2, 0xFE, 0x1B, 0xED, 0xF4, 0xED, 0x67, 0xF4]`

```
for (local_24 = 0; local_24 < 0x17; local_24++) {
    for (local_28 = 0; local_28 < 8; local_28++) {
```

- It iterates through all 23*8 = 184 bits in local_58 from left to right (MSB to LSB).

- The input bit index local_20 starts at 0, but immediately gets set to 1 on the first iteration (if (local_20 == 0) local_20 = 1;). It then increments to 7, wraps around to 0, shifts to the next input character (local_1c), gets forced to 1 again, and repeats.

- As a result, bit 0 (the most significant bit) of every character in param_1 is ignored, and only bits 1 through 7 (7 bits per character) are read.


## python script

```python
# Encrypted array bytes extracted from local_58
target_bytes = [
    0xE1, 0xA7, 0x1E, 0xF8, 0x75, 0x23, 0x7B, 0x61,
    0xB9, 0x9D, 0xFC, 0x5A, 0x5B, 0xDF, 0x69, 0xD2,
    0xFE, 0x1B, 0xED, 0xF4, 0xED, 0x67, 0xF4
]

# Extract all 184 bits MSB to LSB
bits = []
for b in target_bytes:
    for shift in range(7, -1, -1):
        bits.append((b >> shift) & 1)

# Group into 7-bit chunks (since bit 0 of each char in param_1 was skipped)
flag = ""
for i in range(0, len(bits) - 6, 7):
    chunk = bits[i:i+7]
    char_code = 0
    for bit in chunk:
        char_code = (char_code << 1) | bit
    flag += chr(char_code)

print(f"Flag: {flag}")

```

## Flag: 

```
picoCTF{0n3_bi7_4t_a_7im3}
```