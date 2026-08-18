import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Sin globals:true, testing-library no registra su limpieza automática y los
// renders se acumulan en document.body entre pruebas: una prueba acaba viendo
// los elementos de la anterior.
afterEach(cleanup);
