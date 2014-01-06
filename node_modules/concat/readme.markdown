### Introducing NodeConcat

NodeConcat is a command line utility that concatenates text files listed in a manifest. It is useful as a simple build tool for CSS, JavaScript, and other text files. It does not do beautification, minification, obfuscation, or compression. You will need other tools for those tasks. 

NodeConcat should work on Mac OS X, Gnu/Linux, and Windows systems capable of running Node.js. Thanks to [ricklws](https://github.com/ricklws) for the Windows support.

NodeConcat is released under the MIT license.

### Getting Started

#### Install NodeConcat with NPM

NodeConcat should be installed globally so that you can run it from the command line from any directory.

```
$ npm install concat -g
```

#### Create a Manifest File

Create a manifest file inside your project directory. The manifest file should include a list of all the files you want to concatenate. You can include directories in the list. The contents of the directory will be recursively included into the list of files to concatenate. Hidden files and duplicates will be omitted.

You should list one file or directory per line in the manifest file. An example is below.

```
lib
src/helpers.js
src
```

In the above example, the entire contents of lib are concatenated into the output file. Then the contents of the src/helpers.js is concatenated into the output file. Finally the entire contents of src are concatenated, but src/helpers.js is excluded this time because it was previously included.

#### Run NodeConcat

Run NodeConcat but passing two arguments: (1) the name of the manifest and (2) the name of the output file.

```
$ concat manifest.txt app.js
```

### License

Copyright (c) 2012 Nickolas Kenyeres

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.