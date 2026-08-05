package utils

import "golang.org/x/crypto/bcrypt"

// bcryptCost trades hashing time for brute-force resistance. 12 is a
// reasonable default for current hardware; raise it if login latency allows.
const bcryptCost = 12

// HashPassword returns a bcrypt hash of the given plaintext password.
func HashPassword(plain string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(plain), bcryptCost)
	if err != nil {
		return "", err
	}
	return string(hash), nil
}

// CheckPassword reports whether plain matches the given bcrypt hash.
func CheckPassword(hash, plain string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(plain))
	return err == nil
}
