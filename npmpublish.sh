#!/bin/sh
npm login

rm -rf dist

mkdir dist

tsc --build --clean

tsc --build

cp package.json dist

cd dist

npm publish --access=public

cd ..

npm logout