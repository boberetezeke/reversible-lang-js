simple-lang-js
==============

A simple virtual machine for learning programming

The language definition is absurdly simple for now. The point is not
to have it be very capable, but to allow me to play around with a gui
in the browser that makes it easy for non-programmers to see how the
computer operates and to solve computing problems in a painless way.

For now all tokens are separated by spaces and statements are terminated
by the end of the line. You can have two types of statements: function
calls, and assignment operations. Function calls can have n arguments.
Assignments can be for a literal or variable by itself or combined with
an arithmetic operation and another literal or variable.

The complete grammer is below:

```
Statement := AssignmentStatement | FunctionStatement
FunctionStatement := functionName (args)(0 or more)
AssignmentStatement := VariableOrLiteral (Operation VariableOrLiteral)(0 or 1)
Operation := + | - | * | /
VariableOrLiteral := variableName | [0-9]+ 
```

           
