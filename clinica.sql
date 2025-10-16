-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 16-10-2025 a las 01:38:41
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `clinica`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `citas`
--

CREATE TABLE `citas` (
  `id` int(30) NOT NULL,
  `id_especialista` int(30) NOT NULL,
  `id_usuario` int(30) NOT NULL,
  `nombre_usuario` varchar(30) NOT NULL,
  `nombre_especialista` varchar(30) NOT NULL,
  `fecha` date NOT NULL,
  `hora` int(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `especialistas`
--

CREATE TABLE `especialistas` (
  `id` int(30) NOT NULL,
  `nombre` varchar(30) NOT NULL,
  `area` varchar(30) NOT NULL,
  `email` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `especialistas`
--

INSERT INTO `especialistas` (`id`, `nombre`, `area`, `email`) VALUES
(1, 'Dra. Elena Mendoza', 'Cardiología', 'elena.mendoza@clinicasalud.com'),
(2, 'Dr. Roberto Silva', 'Pediatría', 'roberto.silva@hospitalcentral.'),
(3, 'Dra. Carolina Vega', 'Ginecología', 'c.vega@centromedico.edu'),
(4, 'Dr. Miguel Ángel Torres', 'Dermatología', 'm.torres@dermaclinic.com'),
(5, 'Dra. Sofía Jiménez', 'Neurología', 's.jimenez@neurocenter.org'),
(6, 'Dr. Andrés López', 'Ortopedia', 'a.lopez@traumatologiahn.com'),
(7, 'Dra. Isabel Ruiz', 'Oftalmología', 'i.ruiz@visionclara.com'),
(8, 'Dr. Fernando Castro', 'Gastroenterología', 'f.castro@digestivomed.net'),
(9, 'Dra. Patricia Navarro', 'Endocrinología', 'p.navarro@endocrinohospital.co'),
(10, 'Dr. Jorge Morales', 'Psiquiatría', 'j.morales@psicosalud.org'),
(11, 'Dra. Adriana Ríos', 'Oncología', 'a.rios@oncocenter.edu'),
(12, 'Dr. Ricardo Peña', 'Nefrología', 'r.pena@renalcare.com'),
(13, 'Dra. Lorena Ortega', 'Neumología', 'l.ortega@respirabien.org'),
(14, 'Dr. Sergio Domínguez', 'Cirugía General', 's.dominguez@quirourgencias.com'),
(15, 'Dra. Valeria Cordero', 'Reumatología', 'v.cordero@artrocenter.net');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(30) NOT NULL,
  `nombre` varchar(30) NOT NULL,
  `email` varchar(30) NOT NULL,
  `pass` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `email`, `pass`) VALUES
(1, 'Vicente', 'vicente-viel@hotmail.comm', 'aa'),
(2, 'user', 'usuario@normal.com', '123'),
(3, 'admin', 'usuario@normwwal.com', '123');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `citas`
--
ALTER TABLE `citas`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `especialistas`
--
ALTER TABLE `especialistas`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `citas`
--
ALTER TABLE `citas`
  MODIFY `id` int(30) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `especialistas`
--
ALTER TABLE `especialistas`
  MODIFY `id` int(30) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(30) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
