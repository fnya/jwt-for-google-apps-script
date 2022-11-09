#!/bin/sh

npm login

rm -rf dist

tsc --build

cp package.json dist

npm publish

cd ..

npm logout