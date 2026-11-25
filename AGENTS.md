# Project architecture rules

- Persist public profile and suggestion data through the existing MongoDB-backed Express API; store reactions separately with a unique post/user key so serverless instances share consistent state.