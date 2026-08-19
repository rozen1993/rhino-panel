import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Sin globals:true, testing-library no registra su limpieza automática y los
// renders se acumulan en document.body entre pruebas: una prueba acaba viendo
// los elementos de la anterior.
afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.cookie = "rhino_cuentas_simuladas=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  document.cookie = "rhino_cuenta_prueba=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
});
