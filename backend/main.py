def encrypt(text, shift):
    result = ""
    for char in text:
        if char.isalpha():
            ascii_offset = ord('a') if char.islower() else ord('A')
            # Shift character and wrap around the alphabet using modulo 26
            new_char = chr((ord(char) - ascii_offset + shift) % 26 + ascii_offset)
            result += new_char
        else:
            result += char
    return result

def decrypt(text, shift):
    return encrypt(text, -shift)

# Example usage
message = "Hello, World!"
shift_key = 3

encrypted_msg = encrypt(message, shift_key)
decrypted_msg = decrypt(encrypted_msg, shift_key)

print("Encrypted:", encrypted_msg)
print("Decrypted:", decrypted_msg)
