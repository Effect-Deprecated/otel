#!/bin/sh
if yarn dedupe --check; then
    echo "No duplicates found. Pursuing..."
else
    echo "ERROR: Lockfile contains duplicates!"
    echo "deduplicating..."
    yarn dedupe
    yarn
    echo "deduplication finished"
    exit 1
fi
