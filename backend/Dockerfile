FROM golang:1.24-alpine AS builder

WORKDIR /build

# Install build dependencies
RUN apk add --no-cache gcc musl-dev

# Copy go mod files first for caching
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the binary
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o pocket-crm .

# --- Production stage ---
FROM alpine:3.21

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /pb

# Copy the binary
COPY --from=builder /build/pocket-crm /pb/pocket-crm

# Copy migrations
COPY --from=builder /build/pb_migrations /pb/pb_migrations

EXPOSE 8090

CMD ["/pb/pocket-crm", "serve", "--http=0.0.0.0:8090"]
