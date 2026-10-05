<?php
/**
 * Front Page · Home da curadoria
 */
if ( ! defined( 'ABSPATH' ) ) exit;
get_header();
$os_city = ondesair_current_city();

// Afinidades (Camada 1)
$afinidades = get_terms( [ 'taxonomy' => 'afinidade', 'hide_empty' => false ] );

// Tipos (Camada 2)
$tipos = get_terms( [ 'taxonomy' => 'tipo', 'hide_empty' => false ] );

// Roteiros em destaque
$roteiros = new WP_Query( [
    'post_type'      => 'roteiro',
    'posts_per_page' => 4,
    'orderby'        => 'menu_order date',
] );

// Lugares em destaque
$lugares = new WP_Query( [
    'post_type'      => 'lugar',
    'posts_per_page' => 6,
    'orderby'        => 'menu_order date',
] );
?>

<div class="shell">

    <!-- HERO -->
    <section class="hero">
        <span class="eyebrow">Curadoria por afinidade · <?php echo esc_html( $os_city ); ?></span>
        <div class="hero-grid">
            <h1>
                Não é um guia.<br>
                <span class="it">É uma dica.</span>
            </h1>
            <aside class="hero-side">
                <p class="lede" style="margin:0;max-width:38ch;">
                    <?php echo esc_html( $os_city ); ?> tem mais do que você imagina. A gente monta um rolê que faz sentido pra você — sem 200 abas abertas, sem perder a noite no Google.
                </p>
                <div class="row gap-12" style="margin-top:24px;">
                    <a class="btn btn-cta btn-lg" href="<?php echo esc_url( get_post_type_archive_link( 'roteiro' ) ); ?>">Quero meu roteiro →</a>
                    <a class="btn btn-ghost btn-lg" href="<?php echo esc_url( home_url( '/mapa' ) ); ?>">Ver no mapa</a>
                </div>
                <p class="mute small" style="margin-top:14px;">Grátis. Sem cadastro pra navegar.</p>
            </aside>
        </div>
    </section>

    <!-- AFFINITY GRID -->
    <?php if ( ! empty( $afinidades ) && ! is_wp_error( $afinidades ) ) : ?>
    <section class="section tight">
        <div class="head">
            <div>
                <span class="eyebrow">01 · Comece pela afinidade</span>
                <h2>O que <span class="accent">você</span> quer hoje?</h2>
            </div>
        </div>
        <div class="aff-grid">
            <?php $i = 0; foreach ( $afinidades as $term ) : $i++; ?>
                <a class="aff-cell" href="<?php echo esc_url( get_term_link( $term ) ); ?>">
                    <span class="aff-num">0<?php echo esc_html( $i ); ?></span>
                    <span class="aff-name"><?php echo esc_html( $term->name ); ?></span>
                    <span class="aff-count"><?php echo (int) $term->count; ?> lugares</span>
                </a>
            <?php endforeach; ?>
        </div>

        <?php if ( ! empty( $tipos ) && ! is_wp_error( $tipos ) ) : ?>
            <div style="margin-top:18px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
                <span class="eyebrow">Filtre por tipo →</span>
                <div class="type-rail">
                    <?php foreach ( $tipos as $t ) : ?>
                        <a class="chip-type" href="<?php echo esc_url( get_term_link( $t ) ); ?>"><?php echo esc_html( $t->name ); ?></a>
                    <?php endforeach; ?>
                </div>
            </div>
        <?php endif; ?>
    </section>
    <?php endif; ?>

    <!-- ROTEIROS -->
    <?php if ( $roteiros->have_posts() ) : ?>
    <section class="section">
        <div class="head">
            <div>
                <span class="eyebrow">Roteiros em destaque</span>
                <h2>Escolhidos a dedo,<br>um a um.</h2>
                <p>Não é lista — é curadoria. Cada roteiro tem propósito e ordem.</p>
            </div>
            <a class="btn btn-ghost btn-sm" href="<?php echo esc_url( get_post_type_archive_link( 'roteiro' ) ); ?>">Ver todos →</a>
        </div>
        <div class="roteiro-grid">
            <?php while ( $roteiros->have_posts() ) : $roteiros->the_post();
                $aff_terms = get_the_terms( get_the_ID(), 'afinidade' );
                $aff = ( $aff_terms && ! is_wp_error( $aff_terms ) ) ? $aff_terms[0] : null;
            ?>
                <a class="card roteiro interactive" href="<?php the_permalink(); ?>">
                    <?php ondesair_thumb( 'os-roteiro', $aff ? $aff->name : '' ); ?>
                    <div class="body">
                        <?php if ( $aff ) : ?><span class="chip"><?php echo esc_html( $aff->name ); ?></span><?php endif; ?>
                        <h3><?php the_title(); ?></h3>
                        <p><?php echo wp_kses_post( get_the_excerpt() ); ?></p>
                        <div class="meta">
                            <span><?php echo (int) ondesair_meta( '_os_paradas', 3 ); ?> paradas</span>
                            <?php $b = ondesair_meta( '_os_bairros' ); if ( $b ) : ?>
                                <span>·</span><span><?php echo esc_html( $b ); ?></span>
                            <?php endif; ?>
                            <?php if ( ondesair_is_vip() ) : ?>
                                <span>·</span><span class="tag-vip">VIP disponível</span>
                            <?php endif; ?>
                        </div>
                    </div>
                </a>
            <?php endwhile; wp_reset_postdata(); ?>
        </div>
    </section>
    <?php endif; ?>

    <!-- LUGARES -->
    <?php if ( $lugares->have_posts() ) : ?>
    <section class="section">
        <div class="head">
            <div>
                <span class="eyebrow">Lugares em destaque</span>
                <h2>Endereços que passaram pelo crivo</h2>
                <p>A gente foi, testou e voltou. Cada um aqui ganhou o lugar.</p>
            </div>
            <a class="btn btn-ghost btn-sm" href="<?php echo esc_url( get_post_type_archive_link( 'lugar' ) ); ?>">Ver tudo →</a>
        </div>
        <div class="places-grid">
            <?php while ( $lugares->have_posts() ) : $lugares->the_post();
                $tipos_post = get_the_terms( get_the_ID(), 'tipo' );
                $tipo_lbl = ( $tipos_post && ! is_wp_error( $tipos_post ) ) ? $tipos_post[0]->name : '';
            ?>
                <a class="card place interactive" href="<?php the_permalink(); ?>">
                    <?php ondesair_thumb( 'os-card', $tipo_lbl ); ?>
                    <div class="body">
                        <?php if ( $tipo_lbl ) : ?><span class="chip-type"><?php echo esc_html( $tipo_lbl ); ?></span><?php endif; ?>
                        <h4><?php the_title(); ?></h4>
                        <p class="sub"><?php echo esc_html( ondesair_meta( '_os_bairro' ) ); ?> · <?php echo wp_kses_post( get_the_excerpt() ); ?></p>
                    </div>
                    <div class="footer">
                        <span class="stars">★ <?php echo esc_html( ondesair_meta( '_os_rating', '4.7' ) ); ?></span>
                        <span><?php echo esc_html( ondesair_price_label() ); ?></span>
                    </div>
                </a>
            <?php endwhile; wp_reset_postdata(); ?>
        </div>
    </section>
    <?php endif; ?>

    <!-- VIP -->
    <section class="section tight">
        <div class="vip">
            <div>
                <span class="tag-vip solid">Experiência VIP</span>
                <h3>Mesa reservada.<br>Brinde na chegada.<br><span class="accent">No seu ritmo.</span></h3>
                <p>Você paga antecipado, chega como convidado. O parceiro entrega. A partir de R$ 89.</p>
            </div>
            <div class="vip-side">
                <a class="btn btn-cta btn-lg" href="<?php echo esc_url( home_url( '/vip' ) ); ?>">Quero uma experiência VIP →</a>
            </div>
        </div>
    </section>

    <!-- NEWSLETTER -->
    <section class="section tight">
        <div class="news">
            <span class="eyebrow">Newsletter</span>
            <h3>Recebe o roteiro da semana<br>direto no seu e-mail.</h3>
            <p class="mute" style="margin-top:8px;">Grátis. Sem enrolação. Só o que vale a pena.</p>
            <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
                <input type="hidden" name="action" value="os_newsletter">
                <input type="email" name="email" placeholder="seu@email.com" required>
                <button class="btn btn-primary" type="submit">Quero receber</button>
            </form>
            <p class="mute small" style="margin-top:18px;"><?php echo esc_html( $os_city ); ?> tem mais do que você imagina. A gente te mostra.</p>
        </div>
    </section>

</div>

<?php get_footer();
