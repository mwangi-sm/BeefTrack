package admin

import (
    "encoding/json"
    "testing"
)

// The React Admin table consumes camelCase user fields.
func TestUserJSONContract(t *testing.T) {
    payload, err := json.Marshal(User{ID: "user-id", FullName: "Ada", AccountStatus: "active"})
    if err != nil { t.Fatal(err) }
    var got map[string]interface{}
    if err := json.Unmarshal(payload, &got); err != nil { t.Fatal(err) }
    for _, key := range []string{"id", "fullName", "accountStatus", "verificationStatus", "createdAt"} {
        if _, ok := got[key]; !ok { t.Errorf("missing JSON key %q in %s", key, payload) }
    }
}
